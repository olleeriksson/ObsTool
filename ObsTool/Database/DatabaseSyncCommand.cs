using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Linq;

namespace ObsTool.Database
{
    // Intentional long-lived maintenance command. It updates hosted MySQL data
    // from a local SQLite source of truth while keeping normal local development
    // on SQLite.
    public static class DatabaseSyncCommand
    {
        private const string CommandName = "db-sync";
        private const string SourceSqliteOption = "--source-sqlite";
        private const string UpdateGeneralTablesOption = "--update-general-tables";
        private const string ReplaceUserDataOption = "--replace-user-data";
        private const string RecreateTargetSchemaOption = "--recreate-target-schema";
        private const string ConfirmRecreateTargetSchemaOption = "--confirm-recreate-target-schema";
        private const string RecreateConfirmationPhrase = "RECREATE TARGET SCHEMA";
        private static readonly IReadOnlyCollection<int> AllowedReplaceUserDataUserIds = new[] { 1, 2 };

        private static readonly IReadOnlyList<GeneralTableSync> GeneralTables = new[]
        {
            new GeneralTableSync("Constellations", new[] { "Id" }),
            new GeneralTableSync("SacDeepSkyObjects", new[] { "Id" }),
            new GeneralTableSync("OtherObjects", new[] { "Id" }),
            new GeneralTableSync("H2500", new[] { "HerschelId" })
        };

        private static readonly IReadOnlyList<TableImport> ReplaceUserDataTables = new[]
        {
            new TableImport("Locations", "source.\"UserId\" = @userId"),
            new TableImport("Instruments", "source.\"UserId\" = @userId"),
            new TableImport("Eyepieces", "source.\"UserId\" = @userId"),
            new TableImport("ObsSessions", "source.\"UserId\" = @userId"),
            new TableImport("Observations", "source.\"UserId\" = @userId"),
            new TableImport("UserObjects", "source.\"UserId\" = @userId"),
            new TableImport("DsoObservations", "EXISTS (SELECT 1 FROM \"Observations\" AS observation WHERE observation.\"Id\" = source.\"ObservationId\" AND observation.\"UserId\" = @userId)"),
            new TableImport("DsoExtra", "source.\"UserId\" = @userId"),
            new TableImport("ObsResources", "source.\"UserId\" = @userId")
        };

        public static bool IsSyncCommand(string[] args)
        {
            return args.Any(arg => string.Equals(arg, CommandName, StringComparison.OrdinalIgnoreCase));
        }

        public static void Run(IServiceProvider services, string[] args)
        {
            var sourceSqlitePath = GetRequiredSourceSqlitePath(args);
            var updateGeneralTables = HasFlag(args, UpdateGeneralTablesOption);
            var replaceUserDataUserIds = GetReplaceUserDataUserIds(args);
            var replaceUserData = replaceUserDataUserIds.Count > 0;
            var recreateTargetSchema = HasFlag(args, RecreateTargetSchemaOption);

            if (!updateGeneralTables && !replaceUserData)
            {
                throw new InvalidOperationException($"Choose at least one operation: {UpdateGeneralTablesOption} and/or {ReplaceUserDataOption}.");
            }

            using var scope = services.CreateScope();
            var targetContext = scope.ServiceProvider.GetRequiredService<MainDbContext>();

            if (IsSameSqliteDatabase(targetContext, sourceSqlitePath))
            {
                throw new InvalidOperationException("The source SQLite database and target database are the same file. Refusing to sync in place.");
            }

            Console.WriteLine($"Target provider: {targetContext.Database.ProviderName}");
            Console.WriteLine($"Source SQLite: {sourceSqlitePath}");
            Console.WriteLine($"Operation: {string.Join(" ", GetOperationNames(updateGeneralTables, replaceUserData))}");
            if (replaceUserData)
            {
                Console.WriteLine($"{ReplaceUserDataOption}: target/source Users.Id {string.Join(", ", replaceUserDataUserIds)}");
            }

            if (recreateTargetSchema)
            {
                ConfirmRecreateTargetSchema(args, targetContext);
                DropAllTargetTables(targetContext);
            }

            Console.WriteLine("Ensuring target schema exists...");
            targetContext.Database.EnsureCreated();

            using var sourceConnection = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = sourceSqlitePath }.ToString());
            sourceConnection.Open();

            var targetConnection = targetContext.Database.GetDbConnection();
            if (targetConnection.State != ConnectionState.Open)
            {
                targetConnection.Open();
            }

            using var targetTransaction = targetConnection.BeginTransaction();
            try
            {
                if (updateGeneralTables)
                {
                    UpdateGeneralTables(sourceConnection, targetConnection, targetTransaction, targetContext.Database.ProviderName);
                }

                if (replaceUserData)
                {
                    foreach (var replaceUserDataUserId in replaceUserDataUserIds)
                    {
                        ReplaceUserData(sourceConnection, targetConnection, targetTransaction, targetContext.Database.ProviderName, replaceUserDataUserId);
                    }
                }

                targetTransaction.Commit();
            }
            catch
            {
                targetTransaction.Rollback();
                throw;
            }
        }

        private static string GetRequiredSourceSqlitePath(string[] args)
        {
            var sourceSqlitePath = GetOptionValue(args, SourceSqliteOption);
            if (string.IsNullOrWhiteSpace(sourceSqlitePath))
            {
                throw new InvalidOperationException($"Missing {SourceSqliteOption}. Example: dotnet run --project ObsTool -- {CommandName} {SourceSqliteOption} C:\\Users\\Olle\\source\\obstool_database_dev.db {UpdateGeneralTablesOption}");
            }

            sourceSqlitePath = Path.GetFullPath(sourceSqlitePath);
            if (!File.Exists(sourceSqlitePath))
            {
                throw new FileNotFoundException("The source SQLite database was not found.", sourceSqlitePath);
            }

            return sourceSqlitePath;
        }

        private static IEnumerable<string> GetOperationNames(bool updateGeneralTables, bool replaceUserData)
        {
            if (updateGeneralTables)
            {
                yield return UpdateGeneralTablesOption;
            }

            if (replaceUserData)
            {
                yield return ReplaceUserDataOption;
            }
        }

        // Parses the required user id list for the replace-user-data operation.
        private static IReadOnlyList<int> GetReplaceUserDataUserIds(string[] args)
        {
            var replaceUserDataUserIds = new List<int>();
            foreach (var arg in args)
            {
                if (string.Equals(arg, ReplaceUserDataOption, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"{ReplaceUserDataOption} requires a user id. Use {ReplaceUserDataOption}=1, {ReplaceUserDataOption}=2, or {ReplaceUserDataOption}=1,2.");
                }

                if (arg.StartsWith(ReplaceUserDataOption + "=", StringComparison.OrdinalIgnoreCase))
                {
                    if (replaceUserDataUserIds.Count > 0)
                    {
                        throw new InvalidOperationException($"{ReplaceUserDataOption} can only be supplied once per db-sync run.");
                    }

                    var optionValue = arg.Substring(ReplaceUserDataOption.Length + 1);
                    foreach (var userIdPart in optionValue.Split(','))
                    {
                        var trimmedUserId = userIdPart.Trim();
                        if (string.IsNullOrWhiteSpace(trimmedUserId) || !int.TryParse(trimmedUserId, out var userId))
                        {
                            throw new InvalidOperationException($"{ReplaceUserDataOption} must contain only 1 and/or 2. Example: {ReplaceUserDataOption}=1,2.");
                        }

                        if (!AllowedReplaceUserDataUserIds.Contains(userId))
                        {
                            throw new InvalidOperationException($"{ReplaceUserDataOption} is only allowed for Users.Id 1 and 2.");
                        }

                        if (replaceUserDataUserIds.Contains(userId))
                        {
                            throw new InvalidOperationException($"{ReplaceUserDataOption} cannot include the same user id more than once.");
                        }

                        replaceUserDataUserIds.Add(userId);
                    }
                }
            }

            return replaceUserDataUserIds;
        }

        private static void ConfirmRecreateTargetSchema(string[] args, MainDbContext targetContext)
        {
            Console.WriteLine();
            Console.WriteLine("WARNING: target schema recreation is destructive.");
            Console.WriteLine("All existing tables in the configured target database will be dropped before EF Core recreates the schema.");
            Console.WriteLine($"Target provider: {targetContext.Database.ProviderName}");
            Console.WriteLine($"Target connection: {GetSafeConnectionString(targetContext.Database.GetConnectionString())}");

            if (HasFlag(args, ConfirmRecreateTargetSchemaOption))
            {
                Console.WriteLine($"{ConfirmRecreateTargetSchemaOption} supplied; continuing without interactive confirmation.");
                Console.WriteLine();
                return;
            }

            Console.Write($"Type '{RecreateConfirmationPhrase}' to continue: ");
            var confirmation = Console.ReadLine();
            if (!string.Equals(confirmation, RecreateConfirmationPhrase, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Target schema recreation was not confirmed. No target tables were dropped.");
            }

            Console.WriteLine();
        }

        private static void DropAllTargetTables(MainDbContext targetContext)
        {
            if (!targetContext.Database.CanConnect())
            {
                Console.WriteLine("Target database cannot be reached yet. Skipping table drop; EnsureCreated will try to create it.");
                return;
            }

            var targetProvider = targetContext.Database.ProviderName;
            var targetConnection = targetContext.Database.GetDbConnection();
            if (targetConnection.State != ConnectionState.Open)
            {
                targetConnection.Open();
            }

            var tableNames = GetTargetTableNames(targetConnection, targetProvider);
            if (tableNames.Count == 0)
            {
                Console.WriteLine("Target database contains no tables to drop.");
                return;
            }

            Console.WriteLine($"Dropping {tableNames.Count} target table(s)...");

            if (IsMySqlProvider(targetProvider))
            {
                ExecuteNonQuery(targetConnection, null, "SET FOREIGN_KEY_CHECKS = 0");
                try
                {
                    foreach (var tableName in tableNames)
                    {
                        ExecuteNonQuery(targetConnection, null, $"DROP TABLE {QuoteIdentifier(targetProvider, tableName)}");
                        Console.WriteLine($"{tableName}: dropped.");
                    }
                }
                finally
                {
                    ExecuteNonQuery(targetConnection, null, "SET FOREIGN_KEY_CHECKS = 1");
                }

                return;
            }

            ExecuteNonQuery(targetConnection, null, "PRAGMA foreign_keys = OFF");
            try
            {
                foreach (var tableName in tableNames)
                {
                    ExecuteNonQuery(targetConnection, null, $"DROP TABLE {QuoteIdentifier(targetProvider, tableName)}");
                    Console.WriteLine($"{tableName}: dropped.");
                }
            }
            finally
            {
                ExecuteNonQuery(targetConnection, null, "PRAGMA foreign_keys = ON");
            }
        }

        private static List<string> GetTargetTableNames(DbConnection targetConnection, string targetProvider)
        {
            if (IsMySqlProvider(targetProvider))
            {
                using var command = targetConnection.CreateCommand();
                command.CommandText = @"
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME";

                using var reader = command.ExecuteReader();
                var tableNames = new List<string>();
                while (reader.Read())
                {
                    tableNames.Add(reader.GetString(0));
                }

                return tableNames;
            }

            using var sqliteCommand = targetConnection.CreateCommand();
            sqliteCommand.CommandText = @"
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
ORDER BY name";

            using var sqliteReader = sqliteCommand.ExecuteReader();
            var sqliteTableNames = new List<string>();
            while (sqliteReader.Read())
            {
                sqliteTableNames.Add(sqliteReader.GetString(0));
            }

            return sqliteTableNames;
        }

        private static void UpdateGeneralTables(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider)
        {
            foreach (var tableSync in GeneralTables)
            {
                UpsertGeneralTable(sourceConnection, targetConnection, targetTransaction, targetProvider, tableSync);
            }
        }

        private static void UpsertGeneralTable(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            GeneralTableSync tableSync)
        {
            var sourceColumns = GetSqliteColumns(sourceConnection, tableSync.TableName);
            if (sourceColumns.Count == 0)
            {
                throw new InvalidOperationException($"Source table '{tableSync.TableName}' does not exist or has no columns.");
            }

            var targetColumns = GetTargetColumns(targetConnection, targetTransaction, targetProvider, tableSync.TableName);
            if (targetColumns.Count == 0)
            {
                throw new InvalidOperationException($"Target table '{tableSync.TableName}' does not exist or has no columns. Use {RecreateTargetSchemaOption} when the target schema must be rebuilt.");
            }

            var columnsToCopy = GetCommonColumns(sourceColumns, targetColumns, tableSync.TableName);
            foreach (var keyColumn in tableSync.KeyColumns)
            {
                if (!columnsToCopy.Contains(keyColumn, StringComparer.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"General table '{tableSync.TableName}' cannot be updated because key column '{keyColumn}' is not available in both source and target.");
                }
            }

            var upsertedRows = UpsertRows(sourceConnection, targetConnection, targetTransaction, targetProvider, tableSync, columnsToCopy);
            Console.WriteLine($"{UpdateGeneralTablesOption}: {tableSync.TableName}: upserted {upsertedRows} row(s) using {columnsToCopy.Count} column(s).");
        }

        private static int UpsertRows(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            GeneralTableSync tableSync,
            IReadOnlyList<string> columns)
        {
            var sourceColumnSql = string.Join(", ", columns.Select(c => QuoteIdentifier("sqlite", c)));
            using var sourceCommand = sourceConnection.CreateCommand();
            sourceCommand.CommandText = $"SELECT {sourceColumnSql} FROM {QuoteIdentifier("sqlite", tableSync.TableName)}";

            using var sourceReader = sourceCommand.ExecuteReader();
            var upsertedRows = 0;
            while (sourceReader.Read())
            {
                using var targetCommand = targetConnection.CreateCommand();
                targetCommand.Transaction = targetTransaction;
                targetCommand.CommandText = BuildUpsertCommandText(targetProvider, tableSync, columns);

                AddReaderParameters(sourceReader, targetCommand, columns.Count);
                targetCommand.ExecuteNonQuery();
                upsertedRows++;
            }

            return upsertedRows;
        }

        private static string BuildUpsertCommandText(
            string targetProvider,
            GeneralTableSync tableSync,
            IReadOnlyList<string> columns)
        {
            var targetColumnSql = string.Join(", ", columns.Select(c => QuoteIdentifier(targetProvider, c)));
            var parameterSql = string.Join(", ", columns.Select((_, i) => $"@p{i}"));
            var tableName = QuoteIdentifier(targetProvider, tableSync.TableName);

            if (IsMySqlProvider(targetProvider))
            {
                var updateSql = BuildUpdateSetSql(targetProvider, columns, tableSync.KeyColumns, useExcludedTable: false);
                return $"INSERT INTO {tableName} ({targetColumnSql}) VALUES ({parameterSql}) ON DUPLICATE KEY UPDATE {updateSql}";
            }

            var keySql = string.Join(", ", tableSync.KeyColumns.Select(c => QuoteIdentifier(targetProvider, c)));
            var sqliteUpdateSql = BuildUpdateSetSql(targetProvider, columns, tableSync.KeyColumns, useExcludedTable: true);
            return $"INSERT INTO {tableName} ({targetColumnSql}) VALUES ({parameterSql}) ON CONFLICT ({keySql}) DO UPDATE SET {sqliteUpdateSql}";
        }

        private static string BuildUpdateSetSql(
            string targetProvider,
            IReadOnlyList<string> columns,
            IReadOnlyCollection<string> keyColumns,
            bool useExcludedTable)
        {
            var updateColumns = columns
                .Where(column => !keyColumns.Contains(column, StringComparer.OrdinalIgnoreCase))
                .ToList();

            if (updateColumns.Count == 0)
            {
                var keyColumn = keyColumns.First();
                return $"{QuoteIdentifier(targetProvider, keyColumn)} = {QuoteIdentifier(targetProvider, keyColumn)}";
            }

            return string.Join(", ", updateColumns.Select(column =>
            {
                var quotedColumn = QuoteIdentifier(targetProvider, column);
                var sourceColumn = useExcludedTable ? $"excluded.{quotedColumn}" : $"VALUES({quotedColumn})";
                return $"{quotedColumn} = {sourceColumn}";
            }));
        }

        private static void ReplaceUserData(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            int userId)
        {
            ValidateSourceUserExists(sourceConnection, userId);
            EnsureTargetUserExists(sourceConnection, targetConnection, targetTransaction, targetProvider, userId);
            DeleteTargetUserData(targetConnection, targetTransaction, targetProvider, userId);

            foreach (var tableImport in ReplaceUserDataTables)
            {
                InsertFilteredRows(sourceConnection, targetConnection, targetTransaction, targetProvider, tableImport, userId);
            }
        }

        private static void ValidateSourceUserExists(SqliteConnection sourceConnection, int userId)
        {
            using var command = sourceConnection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM \"Users\" WHERE \"Id\" = @userId";
            AddUserIdParameter(command, userId);

            var rows = Convert.ToInt64(command.ExecuteScalar());
            if (rows != 1)
            {
                throw new InvalidOperationException($"Source SQLite must contain exactly one Users row with Id {userId}; found {rows}.");
            }
        }

        private static void EnsureTargetUserExists(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            int userId)
        {
            var targetRows = CountRows(
                targetConnection,
                targetTransaction,
                targetProvider,
                "Users",
                $"{QuoteIdentifier(targetProvider, "Id")} = @userId",
                command => AddUserIdParameter(command, userId));

            if (targetRows > 0)
            {
                Console.WriteLine($"{ReplaceUserDataOption}: Users: target user {userId} already exists; leaving account row unchanged.");
                return;
            }

            InsertFilteredRows(
                sourceConnection,
                targetConnection,
                targetTransaction,
                targetProvider,
                new TableImport("Users", "source.\"Id\" = @userId"),
                userId);
        }

        private static void DeleteTargetUserData(DbConnection targetConnection, DbTransaction targetTransaction, string targetProvider, int userId)
        {
            var observationsTable = QuoteIdentifier(targetProvider, "Observations");
            var userIdColumn = QuoteIdentifier(targetProvider, "UserId");
            var observationIdColumn = QuoteIdentifier(targetProvider, "ObservationId");
            var observationIdSubquery = $"SELECT {QuoteIdentifier(targetProvider, "Id")} FROM {observationsTable} WHERE {userIdColumn} = @userId";

            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "ObsResources", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "DsoObservations", $"{observationIdColumn} IN ({observationIdSubquery})", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "DsoExtra", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "Observations", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "UserObjects", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "ObsSessions", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "Eyepieces", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "Instruments", $"{userIdColumn} = @userId", userId);
            ExecuteUserDelete(targetConnection, targetTransaction, targetProvider, "Locations", $"{userIdColumn} = @userId", userId);
        }

        private static void ExecuteUserDelete(
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            string tableName,
            string whereClause,
            int userId)
        {
            using var command = targetConnection.CreateCommand();
            command.Transaction = targetTransaction;
            command.CommandText = $"DELETE FROM {QuoteIdentifier(targetProvider, tableName)} WHERE {whereClause}";
            AddUserIdParameter(command, userId);

            var deletedRows = command.ExecuteNonQuery();
            Console.WriteLine($"{ReplaceUserDataOption}: {tableName}: deleted {deletedRows} row(s).");
        }

        private static void InsertFilteredRows(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            TableImport tableImport,
            int userId)
        {
            var sourceColumns = GetSqliteColumns(sourceConnection, tableImport.TableName);
            if (sourceColumns.Count == 0)
            {
                throw new InvalidOperationException($"Source table '{tableImport.TableName}' does not exist or has no columns.");
            }

            var targetColumns = GetTargetColumns(targetConnection, targetTransaction, targetProvider, tableImport.TableName);
            if (targetColumns.Count == 0)
            {
                throw new InvalidOperationException($"Target table '{tableImport.TableName}' does not exist or has no columns. Use {RecreateTargetSchemaOption} when the target schema must be rebuilt.");
            }

            var columnsToCopy = GetCommonColumns(sourceColumns, targetColumns, tableImport.TableName);
            var insertedRows = InsertRows(sourceConnection, targetConnection, targetTransaction, targetProvider, tableImport, columnsToCopy, userId);
            Console.WriteLine($"{ReplaceUserDataOption}: {tableImport.TableName}: inserted {insertedRows} row(s) using {columnsToCopy.Count} column(s).");
        }

        private static int InsertRows(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            TableImport tableImport,
            IReadOnlyList<string> columns,
            int userId)
        {
            var tableName = tableImport.TableName;
            var sourceColumnSql = string.Join(", ", columns.Select(c => $"source.{QuoteIdentifier("sqlite", c)}"));
            using var sourceCommand = sourceConnection.CreateCommand();
            sourceCommand.CommandText = $"SELECT {sourceColumnSql} FROM {QuoteIdentifier("sqlite", tableName)} AS source";
            if (!string.IsNullOrWhiteSpace(tableImport.SourceWhereClause))
            {
                sourceCommand.CommandText += $" WHERE {tableImport.SourceWhereClause}";
                AddUserIdParameter(sourceCommand, userId);
            }

            using var sourceReader = sourceCommand.ExecuteReader();
            var insertedRows = 0;

            while (sourceReader.Read())
            {
                using var targetCommand = targetConnection.CreateCommand();
                targetCommand.Transaction = targetTransaction;

                var targetColumnSql = string.Join(", ", columns.Select(c => QuoteIdentifier(targetProvider, c)));
                var parameterSql = string.Join(", ", columns.Select((_, i) => $"@p{i}"));
                targetCommand.CommandText = $"INSERT INTO {QuoteIdentifier(targetProvider, tableName)} ({targetColumnSql}) VALUES ({parameterSql})";

                AddReaderParameters(sourceReader, targetCommand, columns.Count);
                targetCommand.ExecuteNonQuery();
                insertedRows++;
            }

            return insertedRows;
        }

        private static IReadOnlyList<string> GetCommonColumns(
            IReadOnlyCollection<string> sourceColumns,
            IReadOnlyCollection<string> targetColumns,
            string tableName)
        {
            var columnsToCopy = targetColumns
                .Where(c => sourceColumns.Contains(c, StringComparer.OrdinalIgnoreCase))
                .ToList();

            if (columnsToCopy.Count == 0)
            {
                throw new InvalidOperationException($"No common columns were found for table '{tableName}'.");
            }

            return columnsToCopy;
        }

        private static void AddReaderParameters(DbDataReader sourceReader, DbCommand targetCommand, int columnCount)
        {
            for (var i = 0; i < columnCount; i++)
            {
                var parameter = targetCommand.CreateParameter();
                parameter.ParameterName = $"@p{i}";
                parameter.Value = sourceReader.IsDBNull(i) ? DBNull.Value : sourceReader.GetValue(i);
                targetCommand.Parameters.Add(parameter);
            }
        }

        private static void AddUserIdParameter(DbCommand command, int userId)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = "@userId";
            parameter.Value = userId;
            command.Parameters.Add(parameter);
        }

        private static List<string> GetSqliteColumns(SqliteConnection connection, string tableName)
        {
            using var command = connection.CreateCommand();
            command.CommandText = $"PRAGMA table_info({QuoteIdentifier("sqlite", tableName)})";
            using var reader = command.ExecuteReader();
            var columns = new List<string>();
            while (reader.Read())
            {
                columns.Add(reader.GetString(reader.GetOrdinal("name")));
            }

            return columns;
        }

        private static List<string> GetTargetColumns(DbConnection connection, DbTransaction transaction, string providerName, string tableName)
        {
            if (IsMySqlProvider(providerName))
            {
                using var command = connection.CreateCommand();
                command.Transaction = transaction;
                command.CommandText = @"
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = @tableName
ORDER BY ORDINAL_POSITION";

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@tableName";
                parameter.Value = tableName;
                command.Parameters.Add(parameter);

                using var reader = command.ExecuteReader();
                var columns = new List<string>();
                while (reader.Read())
                {
                    columns.Add(reader.GetString(0));
                }

                return columns;
            }

            using var sqliteCommand = connection.CreateCommand();
            sqliteCommand.Transaction = transaction;
            sqliteCommand.CommandText = $"PRAGMA table_info({QuoteIdentifier("sqlite", tableName)})";
            using var sqliteReader = sqliteCommand.ExecuteReader();
            var sqliteColumns = new List<string>();
            while (sqliteReader.Read())
            {
                sqliteColumns.Add(sqliteReader.GetString(sqliteReader.GetOrdinal("name")));
            }

            return sqliteColumns;
        }

        private static long CountRows(DbConnection connection, DbTransaction transaction, string providerName, string tableName)
        {
            return CountRows(connection, transaction, providerName, tableName, null, null);
        }

        private static long CountRows(
            DbConnection connection,
            DbTransaction transaction,
            string providerName,
            string tableName,
            string whereClause,
            Action<DbCommand> configureCommand)
        {
            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = $"SELECT COUNT(*) FROM {QuoteIdentifier(providerName, tableName)}";
            if (!string.IsNullOrWhiteSpace(whereClause))
            {
                command.CommandText += $" WHERE {whereClause}";
            }

            configureCommand?.Invoke(command);
            return Convert.ToInt64(command.ExecuteScalar());
        }

        private static void ExecuteNonQuery(DbConnection connection, DbTransaction transaction, string commandText)
        {
            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = commandText;
            command.ExecuteNonQuery();
        }

        private static bool IsSameSqliteDatabase(MainDbContext targetContext, string sourceSqlitePath)
        {
            if (!string.Equals(targetContext.Database.ProviderName, "Microsoft.EntityFrameworkCore.Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var targetConnectionString = targetContext.Database.GetConnectionString();
            var targetBuilder = new SqliteConnectionStringBuilder(targetConnectionString);
            if (string.IsNullOrWhiteSpace(targetBuilder.DataSource))
            {
                return false;
            }

            var targetPath = Path.GetFullPath(targetBuilder.DataSource);
            return string.Equals(targetPath, sourceSqlitePath, StringComparison.OrdinalIgnoreCase);
        }

        private static string QuoteIdentifier(string providerName, string identifier)
        {
            if (IsMySqlProvider(providerName))
            {
                return $"`{identifier.Replace("`", "``")}`";
            }

            return $"\"{identifier.Replace("\"", "\"\"")}\"";
        }

        private static bool IsMySqlProvider(string providerName)
        {
            return providerName?.IndexOf("MySql", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool HasFlag(string[] args, string flag)
        {
            return args.Any(arg => string.Equals(arg, flag, StringComparison.OrdinalIgnoreCase));
        }

        private static string GetOptionValue(string[] args, string optionName)
        {
            for (var i = 0; i < args.Length - 1; i++)
            {
                if (string.Equals(args[i], optionName, StringComparison.OrdinalIgnoreCase))
                {
                    return args[i + 1];
                }
            }

            return null;
        }

        private static string GetSafeConnectionString(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return connectionString;
            }

            var builder = new DbConnectionStringBuilder { ConnectionString = connectionString };
            var keys = builder.Keys.Cast<string>().ToList();
            foreach (var key in keys)
            {
                if (IsSensitiveConnectionStringKey(key))
                {
                    builder[key] = "***";
                }
            }

            return builder.ConnectionString;
        }

        private static bool IsSensitiveConnectionStringKey(string key)
        {
            return string.Equals(key, "Password", StringComparison.OrdinalIgnoreCase)
                || string.Equals(key, "Pwd", StringComparison.OrdinalIgnoreCase);
        }

        private sealed class GeneralTableSync
        {
            public GeneralTableSync(string tableName, IReadOnlyCollection<string> keyColumns)
            {
                TableName = tableName;
                KeyColumns = keyColumns;
            }

            public string TableName { get; }

            public IReadOnlyCollection<string> KeyColumns { get; }
        }

        private sealed class TableImport
        {
            public TableImport(string tableName, string sourceWhereClause = null)
            {
                TableName = tableName;
                SourceWhereClause = sourceWhereClause;
            }

            public string TableName { get; }

            public string SourceWhereClause { get; }
        }
    }
}
