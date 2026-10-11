using System;
using System.Data.Common;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace TestProject
{
    /// <summary>
    /// Enforces MySQL's single-reader restriction in SQLite tests, including reads and writes.
    /// </summary>
    internal sealed class SingleReaderInterceptor : DbCommandInterceptor
    {
        private readonly ConditionalWeakTable<DbConnection, ReaderState> _connections = new();

        /// <summary>
        /// Holds reader state per physical connection without keeping disposed connections alive.
        /// </summary>
        private sealed class ReaderState
        {
            public DbDataReader Reader { get; set; }
        }

        /// <summary>
        /// Allows a command only once the preceding reader on its connection has closed or been disposed.
        /// </summary>
        private void EnsureReaderClosed(DbCommand command)
        {
            var state = _connections.GetOrCreateValue(command.Connection);
            lock (state)
            {
                if (state.Reader != null && !state.Reader.IsClosed)
                {
                    throw new InvalidOperationException(
                        "There is already an open DataReader associated with this Connection which must be closed first.");
                }

                state.Reader = null;
            }
        }

        /// <summary>
        /// Checks synchronous queries before their reader opens.
        /// </summary>
        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
        {
            EnsureReaderClosed(command);
            return result;
        }

        /// <summary>
        /// Applies the same restriction to asynchronous queries.
        /// </summary>
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            return new(ReaderExecuting(command, eventData, result));
        }

        /// <summary>
        /// Tracks a successful reader on its own connection; failed commands leave no reader state.
        /// </summary>
        public override DbDataReader ReaderExecuted(
            DbCommand command, CommandExecutedEventData eventData, DbDataReader result)
        {
            var state = _connections.GetOrCreateValue(command.Connection);
            lock (state)
            {
                state.Reader = result;
            }

            return result;
        }

        /// <summary>
        /// Tracks asynchronous readers using the same connection state as synchronous readers.
        /// </summary>
        public override ValueTask<DbDataReader> ReaderExecutedAsync(
            DbCommand command, CommandExecutedEventData eventData, DbDataReader result,
            CancellationToken cancellationToken = default)
        {
            return new(ReaderExecuted(command, eventData, result));
        }

        /// <summary>
        /// Rejects synchronous writes while a reader is still open.
        /// </summary>
        public override InterceptionResult<int> NonQueryExecuting(
            DbCommand command, CommandEventData eventData, InterceptionResult<int> result)
        {
            EnsureReaderClosed(command);
            return result;
        }

        /// <summary>
        /// Rejects asynchronous writes while a reader is still open.
        /// </summary>
        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            return new(NonQueryExecuting(command, eventData, result));
        }

        /// <summary>
        /// Rejects synchronous scalar commands while a reader is still open.
        /// </summary>
        public override InterceptionResult<object> ScalarExecuting(
            DbCommand command, CommandEventData eventData, InterceptionResult<object> result)
        {
            EnsureReaderClosed(command);
            return result;
        }

        /// <summary>
        /// Rejects asynchronous scalar commands while a reader is still open.
        /// </summary>
        public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
            DbCommand command, CommandEventData eventData, InterceptionResult<object> result,
            CancellationToken cancellationToken = default)
        {
            return new(ScalarExecuting(command, eventData, result));
        }
    }
}
