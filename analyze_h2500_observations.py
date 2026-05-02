"""Analyze H2500/H400 observation counts against a selected SQLite DB.

The script prints the exact SQL it runs so it can be copied into an SQL client,
then prints aligned result tables for the live observation cross-reference and
the two imported H2500 status sources.
"""

import argparse
import sqlite3
from pathlib import Path


DEFAULT_DB_KEY = "DEV"
DATABASE_TARGETS = {
    "DEV": Path(r"C:\Users\Olle\source\obstool_database_dev.db"),
    "PROD": Path(r"G:\My Drive\Docs\Astronomy\Observations\ObsTool\obstool_database.db"),
}

COUNTS_SQL = """
WITH CrossRef AS (
    SELECT
        h.HerschelId,
        h.H400,
        MAX(CASE WHEN o.NonDetection = 0 AND d.NonDetection = 0 THEN 1 ELSE 0 END) AS HasDetection
    FROM H2500 h
    JOIN DsoObservations d ON d.DsoId = h.SacDeepSkyObjectsId
    JOIN Observations o ON o.Id = d.ObservationId
    GROUP BY h.HerschelId, h.H400
), Counts AS (
    SELECT 'CrossRef detected' AS Source,
           COUNT(CASE WHEN HasDetection = 1 THEN 1 END) AS H2500,
           COUNT(CASE WHEN H400 = 1 AND HasDetection = 1 THEN 1 END) AS H400
    FROM CrossRef
   UNION ALL
    SELECT 'CrossRef detected or tried',
           COUNT(*),
           COUNT(CASE WHEN H400 = 1 THEN 1 END)
    FROM CrossRef
   UNION ALL
    SELECT 'CrossRef non-detection',
           COUNT(CASE WHEN HasDetection = 0 THEN 1 END),
           COUNT(CASE WHEN H400 = 1 AND HasDetection = 0 THEN 1 END)
    FROM CrossRef
   UNION ALL
    SELECT 'Status=2 seen',
           COUNT(CASE WHEN Status = 2 THEN 1 END),
           COUNT(CASE WHEN H400 = 1 AND Status = 2 THEN 1 END)
    FROM H2500
   UNION ALL
    SELECT 'Status seen or tried',
           COUNT(CASE WHEN Status IN (2, 3) THEN 1 END),
           COUNT(CASE WHEN H400 = 1 AND Status IN (2, 3) THEN 1 END)
    FROM H2500
   UNION ALL
    SELECT 'Status tried',
           COUNT(CASE WHEN Status = 3 THEN 1 END),
           COUNT(CASE WHEN H400 = 1 AND Status = 3 THEN 1 END)
    FROM H2500
)
SELECT Source, H2500, H400
FROM Counts;
""".strip()

DETECTED_STATUS_MISMATCH_SQL = """
WITH CrossRef AS (
    SELECT
        h.HerschelId,
        MAX(CASE WHEN o.NonDetection = 0 AND d.NonDetection = 0 THEN 1 ELSE 0 END) AS HasDetection
    FROM H2500 h
    JOIN DsoObservations d ON d.DsoId = h.SacDeepSkyObjectsId
    JOIN Observations o ON o.Id = d.ObservationId
    GROUP BY h.HerschelId
)
SELECT
    h.HerschelId,
    h.HerschelNo,
    h.Name,
    h.Cat,
    h.CatNo,
    h.H400,
    h.Status,
    h.SacDeepSkyObjectsId
FROM H2500 h
JOIN CrossRef x ON x.HerschelId = h.HerschelId
WHERE x.HasDetection = 1
  AND (h.Status IS NULL OR h.Status <> 2)
ORDER BY h.HerschelId;
""".strip()

NON_DETECTION_STATUS_MISMATCH_SQL = """
WITH CrossRef AS (
    SELECT
        h.HerschelId,
        MAX(CASE WHEN o.NonDetection = 0 AND d.NonDetection = 0 THEN 1 ELSE 0 END) AS HasDetection
    FROM H2500 h
    JOIN DsoObservations d ON d.DsoId = h.SacDeepSkyObjectsId
    JOIN Observations o ON o.Id = d.ObservationId
    GROUP BY h.HerschelId
)
SELECT
    h.HerschelId,
    h.HerschelNo,
    h.Name,
    h.Cat,
    h.CatNo,
    h.H400,
    h.Status,
    h.SacDeepSkyObjectsId
FROM H2500 h
JOIN CrossRef x ON x.HerschelId = h.HerschelId
WHERE x.HasDetection = 0
  AND (h.Status IS NULL OR h.Status <> 3)
ORDER BY h.HerschelId;
""".strip()


def print_table(headers, rows):
    widths = [
        max(len(str(value)) for value in [header] + [row[index] for row in rows])
        for index, header in enumerate(headers)
    ]

    def format_row(row):
        formatted = []
        for _, value in enumerate(row):
            text = "NULL" if value is None else str(value)
            formatted.append(text.ljust(widths[len(formatted)]))
        return "  ".join(formatted)

    print(format_row(headers))
    print("  ".join("-" * width for width in widths))
    for row in rows:
        print(format_row(row))


def signed_delta(value):
    return f"{value:+d}"


def format_status(value):
    status_labels = {
        None: "",
        1: "1=marked",
        2: "2=seen",
        3: "3=tried",
    }
    return status_labels.get(value, str(value))


def format_object_rows(rows):
    return [
        (*row[:6], format_status(row[6]), row[7])
        for row in rows
    ]


def build_difference_rows(rows):
    by_source = {source: (h2500, h400) for source, h2500, h400 in rows}
    baseline_h2500, baseline_h400 = by_source["CrossRef detected"]
    compare_sources = ("Status=2 seen",)

    return [
        (
            source,
            signed_delta(by_source[source][0] - baseline_h2500),
            signed_delta(by_source[source][1] - baseline_h400),
        )
        for source in compare_sources
    ]


def print_sql_block(title, sql):
    print(title)
    print("-" * len(title))
    print(sql)
    print()


def resolve_database(database_arg):
    if database_arg is not None:
        if not database_arg.exists():
            raise SystemExit(f'Database not found: "{database_arg}"')
        return database_arg

    print("Select database:")
    target_keys = list(DATABASE_TARGETS)
    for index, key in enumerate(target_keys, start=1):
        default_marker = " [default]" if key == DEFAULT_DB_KEY else ""
        print(f"  {index}. {key}: {DATABASE_TARGETS[key]}{default_marker}")

    response = input(f"Database [{DEFAULT_DB_KEY}]: ").strip().upper()
    if response == "":
        response = DEFAULT_DB_KEY
    elif response in {str(index) for index in range(1, len(target_keys) + 1)}:
        response = target_keys[int(response) - 1]

    if response not in DATABASE_TARGETS:
        raise SystemExit(f"Unknown database selection: {response}")

    database_path = DATABASE_TARGETS[response]
    if not database_path.exists():
        raise SystemExit(f'Database not found: "{database_path}"')

    return database_path


def main():
    parser = argparse.ArgumentParser(
        description="Compare H2500/H400 observation status against parsed observations."
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=None,
        help="Path to the SQLite database. If omitted, choose DEV or PROD.",
    )
    args = parser.parse_args()
    database_path = resolve_database(args.database)

    print(f"Database: {database_path.resolve()}")
    print()

    print_sql_block("Counts SQL", COUNTS_SQL)
    print_sql_block("Detected Status Mismatch SQL", DETECTED_STATUS_MISMATCH_SQL)
    print_sql_block("Non-Detection Status Mismatch SQL", NON_DETECTION_STATUS_MISMATCH_SQL)

    connection = sqlite3.connect(f"{database_path.as_uri()}?mode=ro", uri=True)
    try:
        rows = list(connection.execute(COUNTS_SQL))
        detected_status_mismatches = list(connection.execute(DETECTED_STATUS_MISMATCH_SQL))
        non_detection_status_mismatches = list(connection.execute(NON_DETECTION_STATUS_MISMATCH_SQL))
    finally:
        connection.close()

    print("Results")
    print("-------")
    print_table(("Source", "H2500", "H400"), rows)
    print()

    print("Differences vs live cross-reference detected")
    print("--------------------------------------------")
    print_table(("Source", "H2500 diff", "H400 diff"), build_difference_rows(rows))
    print()

    print("Cross-reference detected, but Status != 2 (ie not detected)")
    print("-----------------------------------------------------------")
    print_table(
        ("HerschelId", "HerschelNo", "Name", "Cat", "CatNo", "H400", "Status", "SacId"),
        format_object_rows(detected_status_mismatches),
    )
    print()

    print("Cross-reference non-detection, but Status != 3 (ie not attempted)")
    print("-----------------------------------------------------------------")
    print_table(
        ("HerschelId", "HerschelNo", "Name", "Cat", "CatNo", "H400", "Status", "SacId"),
        format_object_rows(non_detection_status_mismatches),
    )


if __name__ == "__main__":
    main()
