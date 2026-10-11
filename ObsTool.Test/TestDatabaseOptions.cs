using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;

namespace TestProject
{
    /// <summary>
    /// Centralizes SQLite test configuration so database tests enforce the hosted MySQL reader restriction.
    /// </summary>
    internal static class TestDatabaseOptions
    {
        // Share the interceptor so separate contexts using the same connection cannot bypass its guard.
        private static readonly SingleReaderInterceptor ReaderInterceptor = new();

        /// <summary>
        /// Creates guarded options for a caller-owned, isolated SQLite test connection.
        /// </summary>
        public static DbContextOptions<MainDbContext> Create(DbConnection connection)
        {
            return new DbContextOptionsBuilder<MainDbContext>()
                .UseSqlite(connection)
                .AddInterceptors(ReaderInterceptor)
                .Options;
        }
    }
}
