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
    // Intentional long-lived maintenance command. It bootstraps or refreshes
    // hosted MySQL reference data from the local SQLite source of truth while
    // keeping normal local development on SQLite.
    public static class DatabaseBootstrapCommand
    {
        private const string CommandName = "db-bootstrap";

        public static bool IsBootstrapCommand(string[] args)
        {
            return args.Any(arg => string.Equals(arg, CommandName, StringComparison.OrdinalIgnoreCase));
        }

        public static void Run(IServiceProvider services, string[] args)
        {
            var sourceSqlitePath = GetOptionValue(args, "--source-sqlite");
            if (string.IsNullOrWhiteSpace(sourceSqlitePath))
            {
                throw new InvalidOperationException($"Missing --source-sqlite. Example: dotnet run --project ObsTool -- {CommandName} --source-sqlite C:\\Users\\Olle\\source\\obstool_database_dev.db");
            }

            sourceSqlitePath = Path.GetFullPath(sourceSqlitePath);
            if (!File.Exists(sourceSqlitePath))
            {
                throw new FileNotFoundException("The source SQLite database was not found.", sourceSqlitePath);
            }

            // Default behavior is conservative: skip existing target rows.
            // Use this flag only when deliberately refreshing reference data,
            // most commonly for H2500 updates.
            var replaceReferenceData = HasFlag(args, "--replace-reference-data");

            using var scope = services.CreateScope();
            var targetContext = scope.ServiceProvider.GetRequiredService<MainDbContext>();

            if (IsSameSqliteDatabase(targetContext, sourceSqlitePath))
            {
                throw new InvalidOperationException("The source SQLite database and target database are the same file. Refusing to bootstrap in place.");
            }

            Console.WriteLine($"Target provider: {targetContext.Database.ProviderName}");
            Console.WriteLine($"Source SQLite: {sourceSqlitePath}");
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
                if (replaceReferenceData)
                {
                    DeleteReferenceTables(targetConnection, targetTransaction, targetContext.Database.ProviderName);
                }

                CopyReferenceTable(sourceConnection, targetConnection, targetTransaction, targetContext.Database.ProviderName, "Constellations", false);
                CopyReferenceTable(sourceConnection, targetConnection, targetTransaction, targetContext.Database.ProviderName, "SacDeepSkyObjects", false);
                CopyReferenceTable(sourceConnection, targetConnection, targetTransaction, targetContext.Database.ProviderName, "H2500", false);
                targetTransaction.Commit();
            }
            catch
            {
                targetTransaction.Rollback();
                throw;
            }
        }

        private static void DeleteReferenceTables(DbConnection targetConnection, DbTransaction targetTransaction, string targetProvider)
        {
            // Delete in dependency order so H2500 rows do not block SacDeepSkyObjects replacement.
            foreach (var tableName in new[] { "H2500", "SacDeepSkyObjects", "Constellations" })
            {
                ExecuteNonQuery(targetConnection, targetTransaction, $"DELETE FROM {QuoteIdentifier(targetProvider, tableName)}");
                Console.WriteLine($"{tableName}: deleted existing reference data.");
            }
        }

        private static void CopyReferenceTable(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            string tableName,
            bool replaceReferenceData)
        {
            var sourceColumns = GetSqliteColumns(sourceConnection, tableName);
            if (sourceColumns.Count == 0)
            {
                throw new InvalidOperationException($"Source table '{tableName}' does not exist or has no columns.");
            }

            var targetColumns = GetTargetColumns(targetConnection, targetTransaction, targetProvider, tableName);
            if (targetColumns.Count == 0)
            {
                throw new InvalidOperationException($"Target table '{tableName}' does not exist or has no columns.");
            }

            var columnsToCopy = targetColumns
                .Where(c => sourceColumns.Contains(c, StringComparer.OrdinalIgnoreCase))
                .ToList();

            if (columnsToCopy.Count == 0)
            {
                throw new InvalidOperationException($"No common columns were found for table '{tableName}'.");
            }

            var existingRows = CountRows(targetConnection, targetTransaction, targetProvider, tableName);
            if (existingRows > 0 && !replaceReferenceData)
            {
                Console.WriteLine($"{tableName}: skipped because target already contains {existingRows} row(s). Use --replace-reference-data to replace it.");
                return;
            }

            if (replaceReferenceData && existingRows > 0)
            {
                ExecuteNonQuery(targetConnection, targetTransaction, $"DELETE FROM {QuoteIdentifier(targetProvider, tableName)}");
            }

            var insertedRows = InsertRows(sourceConnection, targetConnection, targetTransaction, targetProvider, tableName, columnsToCopy);
            Console.WriteLine($"{tableName}: inserted {insertedRows} row(s) using {columnsToCopy.Count} column(s).");
        }

        private static int InsertRows(
            SqliteConnection sourceConnection,
            DbConnection targetConnection,
            DbTransaction targetTransaction,
            string targetProvider,
            string tableName,
            IReadOnlyList<string> columns)
        {
            var sourceColumnSql = string.Join(", ", columns.Select(c => QuoteIdentifier("sqlite", c)));
            using var sourceCommand = sourceConnection.CreateCommand();
            sourceCommand.CommandText = $"SELECT {sourceColumnSql} FROM {QuoteIdentifier("sqlite", tableName)}";

            using var sourceReader = sourceCommand.ExecuteReader();
            var insertedRows = 0;

            while (sourceReader.Read())
            {
                using var targetCommand = targetConnection.CreateCommand();
                targetCommand.Transaction = targetTransaction;

                var targetColumnSql = string.Join(", ", columns.Select(c => QuoteIdentifier(targetProvider, c)));
                var parameterSql = string.Join(", ", columns.Select((_, i) => $"@p{i}"));
                targetCommand.CommandText = $"INSERT INTO {QuoteIdentifier(targetProvider, tableName)} ({targetColumnSql}) VALUES ({parameterSql})";

                for (var i = 0; i < columns.Count; i++)
                {
                    var parameter = targetCommand.CreateParameter();
                    parameter.ParameterName = $"@p{i}";
                    parameter.Value = sourceReader.IsDBNull(i) ? DBNull.Value : sourceReader.GetValue(i);
                    targetCommand.Parameters.Add(parameter);
                }

                targetCommand.ExecuteNonQuery();
                insertedRows++;
            }

            return insertedRows;
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
            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = $"SELECT COUNT(*) FROM {QuoteIdentifier(providerName, tableName)}";
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
    }
}
