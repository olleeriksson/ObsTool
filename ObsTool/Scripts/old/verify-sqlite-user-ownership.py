import argparse
import sqlite3
import sys
from pathlib import Path


OWNER_TABLES = [
    ("Locations", "Id"),
    ("Instruments", "Id"),
    ("Eyepieces", "Id"),
    ("ObsSessions", "Id"),
    ("Observations", "Id"),
    ("DsoExtra", "Id"),
    ("ObsResources", "Id"),
]

UNCHANGED_TABLES = [
    ("DsoObservations", "ObservationId, DsoId, CustomObjectName"),
]

OLD_SUFFIX = "_old_user_migration"


def table_exists(connection, table_name):
    return connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table_name,),
    ).fetchone() is not None


def columns(connection, table_name):
    return [row[1] for row in connection.execute(f'PRAGMA table_info("{table_name}")')]


def count_rows(connection, table_name):
    return connection.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]


def quote_columns(column_names):
    return ", ".join(f'"{column}"' for column in column_names)


def compare_table(connection, table_name, order_by, excluded_columns, old_where=None, new_where=None):
    old_table_name = table_name + OLD_SUFFIX
    if not table_exists(connection, old_table_name):
        return [f"{old_table_name}: missing old table"]
    if not table_exists(connection, table_name):
        return [f"{table_name}: missing new table"]

    old_columns = columns(connection, old_table_name)
    new_columns = columns(connection, table_name)
    common_columns = [
        column for column in old_columns
        if column in new_columns and column not in excluded_columns
    ]

    errors = []
    old_filter = f" WHERE {old_where}" if old_where else ""
    new_filter = f" WHERE {new_where}" if new_where else ""
    old_count = connection.execute(f'SELECT COUNT(*) FROM "{old_table_name}"{old_filter}').fetchone()[0]
    new_count = connection.execute(f'SELECT COUNT(*) FROM "{table_name}"{new_filter}').fetchone()[0]
    if old_count != new_count:
        errors.append(f"{table_name}: row count differs, old={old_count}, new={new_count}")

    column_sql = quote_columns(common_columns)
    old_rows = connection.execute(
        f'SELECT {column_sql} FROM "{old_table_name}"{old_filter} ORDER BY {order_by}'
    ).fetchall()
    new_rows = connection.execute(
        f'SELECT {column_sql} FROM "{table_name}"{new_filter} ORDER BY {order_by}'
    ).fetchall()

    if old_rows != new_rows:
        errors.append(f"{table_name}: data differs in columns {', '.join(common_columns)}")

    return errors


def verify_owner_values(connection, owner_user_id):
    errors = []
    for table_name, _ in OWNER_TABLES:
        bad_count = connection.execute(
            f'SELECT COUNT(*) FROM "{table_name}" WHERE "UserId" <> ?',
            (owner_user_id,),
        ).fetchone()[0]
        if bad_count:
            errors.append(f"{table_name}: {bad_count} row(s) do not have UserId={owner_user_id}")
    return errors


def verify_user_exists(connection, owner_user_id):
    exists = connection.execute(
        'SELECT 1 FROM "Users" WHERE "Id" = ?',
        (owner_user_id,),
    ).fetchone()
    return [] if exists else [f'Users: no owner row with Id={owner_user_id}']


def verify_foreign_keys(connection):
    rows = connection.execute("PRAGMA foreign_key_check").fetchall()
    if not rows:
        return []

    return [f"foreign_key_check: {row}" for row in rows]


def verify_no_old_migration_tables(connection):
    errors = []
    for table_name, _ in OWNER_TABLES + UNCHANGED_TABLES:
        old_table_name = table_name + OLD_SUFFIX
        if table_exists(connection, old_table_name):
            errors.append(f"{old_table_name}: old migration table still exists")
    return errors


def report_dropped_old_orphan_resources(connection):
    old_resources = "ObsResources" + OLD_SUFFIX
    old_observations = "Observations" + OLD_SUFFIX
    if not table_exists(connection, old_resources) or not table_exists(connection, old_observations):
        return

    rows = connection.execute(f'''
        SELECT r."Id", r."ObservationId", r."Type", r."Name", r."Url"
        FROM "{old_resources}" r
        LEFT JOIN "{old_observations}" o ON o."Id" = r."ObservationId"
        WHERE o."Id" IS NULL
        ORDER BY r."Id"
    ''').fetchall()

    if rows:
        print(f"Ignored {len(rows)} orphan ObsResources row(s) present only in the old table:")
        for row in rows:
            print(f"- Id={row[0]}, ObservationId={row[1]}, Type={row[2]}, Name={row[3]}, Url={row[4]}")


def main():
    parser = argparse.ArgumentParser(description="Verify SQLite user-ownership migration.")
    parser.add_argument("database", help="Path to the SQLite database to verify.")
    parser.add_argument("--owner-user-id", type=int, default=1)
    parser.add_argument(
        "--allow-dropped-orphan-resources",
        action="store_true",
        help="Allow old ObsResources rows that referenced missing old Observations to be absent from the new table.",
    )
    parser.add_argument(
        "--final-only",
        action="store_true",
        help="Run only final integrity checks after old migration tables have been dropped.",
    )
    args = parser.parse_args()

    database_path = Path(args.database)
    if not database_path.exists():
        print(f"Database not found: {database_path}", file=sys.stderr)
        return 2

    connection = sqlite3.connect(f"file:{database_path.as_posix()}?mode=ro", uri=True)
    try:
        errors = []
        errors.extend(verify_user_exists(connection, args.owner_user_id))
        if args.final_only:
            errors.extend(verify_no_old_migration_tables(connection))
        else:
            for table_name, order_by in OWNER_TABLES:
                if table_name == "ObsResources" and args.allow_dropped_orphan_resources:
                    errors.extend(compare_table(
                        connection,
                        table_name,
                        order_by,
                        {"UserId"},
                        old_where=(
                            '"ObservationId" IN '
                            '(SELECT "Id" FROM "Observations_old_user_migration")'
                        ),
                    ))
                else:
                    errors.extend(compare_table(connection, table_name, order_by, {"UserId"}))
            for table_name, order_by in UNCHANGED_TABLES:
                errors.extend(compare_table(connection, table_name, order_by, set()))
        errors.extend(verify_owner_values(connection, args.owner_user_id))
        errors.extend(verify_foreign_keys(connection))
        if args.allow_dropped_orphan_resources and not args.final_only:
            report_dropped_old_orphan_resources(connection)
    finally:
        connection.close()

    if errors:
        print("Verification failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
