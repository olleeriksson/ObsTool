using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using ObsTool;
using ObsTool.Database;

namespace TestProject
{
    [TestFixture]
    public class SingleReaderInterceptorTest
    {
        /// <summary>
        /// Checks every command type, independent connections, and recovery after reader close or disposal.
        /// </summary>
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task Commands_RejectOverlapAndAllowClosedReaders(bool asynchronous, bool disposeReader)
        {
            using var connection = new SqliteConnection("DataSource=:memory:");
            using var otherConnection = new SqliteConnection("DataSource=:memory:");
            connection.Open();
            otherConnection.Open();
            using var command = connection.CreateCommand();
            using var otherCommand = otherConnection.CreateCommand();
            command.CommandText = "SELECT 1";
            otherCommand.CommandText = "SELECT 2";
            var interceptor = new SingleReaderInterceptor();
            using var reader = command.ExecuteReader();

            // Register the real SQLite reader through the same callback EF uses for the selected execution mode.
            if (asynchronous)
            {
                await interceptor.ReaderExecutedAsync(command, null, reader);
                await Assert.ThrowsAsync<InvalidOperationException>(async () => await interceptor.ReaderExecutingAsync(command, null, default));
                await Assert.ThrowsAsync<InvalidOperationException>(async () => await interceptor.NonQueryExecutingAsync(command, null, default));
                await Assert.ThrowsAsync<InvalidOperationException>(async () => await interceptor.ScalarExecutingAsync(command, null, default));
                await interceptor.ReaderExecutingAsync(otherCommand, null, default);
            }
            else
            {
                interceptor.ReaderExecuted(command, null, reader);
                Assert.Throws<InvalidOperationException>(() => interceptor.ReaderExecuting(command, null, default));
                Assert.Throws<InvalidOperationException>(() => interceptor.NonQueryExecuting(command, null, default));
                Assert.Throws<InvalidOperationException>(() => interceptor.ScalarExecuting(command, null, default));
                interceptor.ReaderExecuting(otherCommand, null, default);
            }

            // Closed and disposed readers must both release the connection for every command type.
            if (disposeReader)
            {
                reader.Dispose();
            }
            else
            {
                reader.Close();
            }

            if (asynchronous)
            {
                await interceptor.ReaderExecutingAsync(command, null, default);
                await interceptor.NonQueryExecutingAsync(command, null, default);
                await interceptor.ScalarExecutingAsync(command, null, default);
            }
            else
            {
                interceptor.ReaderExecuting(command, null, default);
                interceptor.NonQueryExecuting(command, null, default);
                interceptor.ScalarExecuting(command, null, default);
            }
        }

        /// <summary>
        /// Verifies shared test options catch actual EF streaming overlaps, including across contexts.
        /// </summary>
        [TestCase(false)]
        [TestCase(true)]
        public async Task SharedOptions_EnforceReaderRestrictionAcrossContexts(bool asynchronous)
        {
            var configuration = new Mock<IConfiguration>();
            configuration.Setup(config => config["Db:Migrate"]).Returns("false");
            Startup.Configuration = configuration.Object;
            using var connection = new SqliteConnection("DataSource=:memory:");
            using var otherConnection = new SqliteConnection("DataSource=:memory:");
            connection.Open();
            otherConnection.Open();
            using var context = CreateContext(connection);
            using var sameConnectionContext = CreateContext(connection);
            using var independentContext = CreateContext(otherConnection);
            // Initialize both contexts before streaming so SQLite registers its functions with no active statement.
            _ = context.Database.GetDbConnection();
            _ = sameConnectionContext.Database.GetDbConnection();
            var query = context.Database.SqlQueryRaw<int>("SELECT 1 AS Value UNION ALL SELECT 2 AS Value");

            // Keep one result stream open and exercise EF queries and writes through other contexts.
            if (asynchronous)
            {
                await using (var rows = query.AsAsyncEnumerable().GetAsyncEnumerator())
                {
                    Assert.That(await rows.MoveNextAsync(), Is.True);
                    await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                        await sameConnectionContext.Database.SqlQueryRaw<int>("SELECT 3 AS Value").ToListAsync());
                    await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                        await sameConnectionContext.Database.ExecuteSqlRawAsync("CREATE TABLE Example (Id INTEGER)"));
                    Assert.That(await independentContext.Database.SqlQueryRaw<int>("SELECT 4 AS Value").SingleAsync(), Is.EqualTo(4));
                }

                Assert.That(await query.ToListAsync(), Is.EqualTo(new[] { 1, 2 }));
                await sameConnectionContext.Database.ExecuteSqlRawAsync("CREATE TABLE Example (Id INTEGER)");
            }
            else
            {
                using (var rows = query.AsEnumerable().GetEnumerator())
                {
                    Assert.That(rows.MoveNext(), Is.True);
                    Assert.Throws<InvalidOperationException>(() =>
                        sameConnectionContext.Database.SqlQueryRaw<int>("SELECT 3 AS Value").ToList());
                    Assert.Throws<InvalidOperationException>(() =>
                        sameConnectionContext.Database.ExecuteSqlRaw("CREATE TABLE Example (Id INTEGER)"));
                    Assert.That(independentContext.Database.SqlQueryRaw<int>("SELECT 4 AS Value").Single(), Is.EqualTo(4));
                }

                Assert.That(query.ToList(), Is.EqualTo(new[] { 1, 2 }));
                sameConnectionContext.Database.ExecuteSqlRaw("CREATE TABLE Example (Id INTEGER)");
            }
        }

        /// <summary>
        /// Constructs a context using the same guarded options as the application database tests.
        /// </summary>
        private static MainDbContext CreateContext(SqliteConnection connection)
        {
            return new MainDbContext(TestDatabaseOptions.Create(connection), new Mock<ILogger<MainDbContext>>().Object);
        }
    }
}
