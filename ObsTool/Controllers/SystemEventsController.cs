using System;
using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [ApiController]
    [Route("api/system-events")]
    public class SystemEventsController : ControllerBase
    {
        private const int DefaultPage = 1;
        private const int DefaultPageSize = 50;
        private const int MaxPageSize = 100;

        private readonly MainDbContext _dbContext;

        public SystemEventsController(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Returns a privileged, newest-first page of persisted system events.
        /// </summary>
        [HttpGet]
        public IActionResult GetSystemEvents(
            [FromQuery] int page = DefaultPage,
            [FromQuery] int pageSize = DefaultPageSize,
            [FromQuery] string search = null,
            [FromQuery] string date = null,
            [FromQuery] int? userId = null,
            [FromQuery] string eventName = null,
            [FromQuery] string eventKey = null)
        {
            if (!UserManagementAuthorization.CanManageUsers(User))
            {
                return Forbid();
            }

            var normalizedPage = Math.Max(page, DefaultPage);
            var normalizedPageSize = Math.Clamp(pageSize, 1, MaxPageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var query = ApplyFilters(_dbContext.Events.AsNoTracking(), search, date, userId, eventName, eventKey)
                .OrderByDescending(systemEvent => systemEvent.OccurredUtc)
                .ThenByDescending(systemEvent => systemEvent.Id);

            var total = query.Count();
            var events = query
                .Skip(skip)
                .Take(normalizedPageSize)
                .Select(systemEvent => new SystemEventDto
                {
                    Id = systemEvent.Id,
                    UserId = systemEvent.UserId,
                    FullName = systemEvent.FullName,
                    EventKey = systemEvent.EventKey,
                    EventName = systemEvent.EventName,
                    Details = systemEvent.Details,
                    OccurredUtc = systemEvent.OccurredUtc,
                    AdminNotificationSentUtc = systemEvent.AdminNotificationSentUtc,
                    AdminNotificationError = systemEvent.AdminNotificationError
                })
                .ToArray();

            return Ok(new PagedResultDto<SystemEventDto>
            {
                Data = events,
                Total = total,
                Count = events.Length,
                More = Math.Max(total - skip - events.Length, 0)
            });
        }

        /// <summary>
        /// Applies exact column filters and the broad search term before paging the event log.
        /// </summary>
        private static IQueryable<SystemEvent> ApplyFilters(
            IQueryable<SystemEvent> query,
            string search,
            string date,
            int? userId,
            string eventName,
            string eventKey)
        {
            var normalizedDate = NormalizeFilterValue(date);
            if (TryParseDateFilter(normalizedDate, out var dateFilter))
            {
                var nextDate = dateFilter.AddDays(1);
                query = query.Where(systemEvent => systemEvent.OccurredUtc >= dateFilter && systemEvent.OccurredUtc < nextDate);
            }

            if (userId.HasValue)
            {
                query = query.Where(systemEvent => systemEvent.UserId == userId.Value);
            }

            var normalizedEventName = NormalizeFilterValue(eventName);
            if (normalizedEventName != null)
            {
                query = query.Where(systemEvent => systemEvent.EventName == normalizedEventName);
            }

            var normalizedEventKey = NormalizeFilterValue(eventKey);
            if (normalizedEventKey != null)
            {
                query = query.Where(systemEvent => systemEvent.EventKey == normalizedEventKey);
            }

            return ApplySearchFilter(query, search);
        }

        /// <summary>
        /// Applies a broad text search across textual event fields, with exact support for date and user id values.
        /// </summary>
        private static IQueryable<SystemEvent> ApplySearchFilter(IQueryable<SystemEvent> query, string search)
        {
            var normalizedSearch = NormalizeFilterValue(search);
            if (normalizedSearch == null)
            {
                return query;
            }

            var likePattern = $"%{normalizedSearch}%";
            var hasSearchUserId = int.TryParse(normalizedSearch, NumberStyles.Integer, CultureInfo.InvariantCulture, out var searchUserId);
            var hasSearchDate = TryParseDateFilter(normalizedSearch, out var searchDate);
            var nextSearchDate = searchDate.AddDays(1);
            var hasSearchTime = TryParseTimeFilter(normalizedSearch, out var searchTime, out var searchHasSeconds);

            return query.Where(systemEvent =>
                EF.Functions.Like(systemEvent.EventKey ?? string.Empty, likePattern)
                || EF.Functions.Like(systemEvent.EventName ?? string.Empty, likePattern)
                || EF.Functions.Like(systemEvent.Details ?? string.Empty, likePattern)
                || EF.Functions.Like(systemEvent.FullName ?? string.Empty, likePattern)
                || EF.Functions.Like(systemEvent.AdminNotificationError ?? string.Empty, likePattern)
                || (hasSearchUserId && systemEvent.UserId == searchUserId)
                || (hasSearchDate && systemEvent.OccurredUtc >= searchDate && systemEvent.OccurredUtc < nextSearchDate)
                || (hasSearchDate && systemEvent.AdminNotificationSentUtc.HasValue && systemEvent.AdminNotificationSentUtc.Value >= searchDate && systemEvent.AdminNotificationSentUtc.Value < nextSearchDate)
                || (hasSearchTime && systemEvent.OccurredUtc.Hour == searchTime.Hours && systemEvent.OccurredUtc.Minute == searchTime.Minutes && (!searchHasSeconds || systemEvent.OccurredUtc.Second == searchTime.Seconds))
                || (hasSearchTime && systemEvent.AdminNotificationSentUtc.HasValue && systemEvent.AdminNotificationSentUtc.Value.Hour == searchTime.Hours && systemEvent.AdminNotificationSentUtc.Value.Minute == searchTime.Minutes && (!searchHasSeconds || systemEvent.AdminNotificationSentUtc.Value.Second == searchTime.Seconds)));
        }

        /// <summary>
        /// Normalizes optional query-string filter values so empty strings behave like missing filters.
        /// </summary>
        private static string NormalizeFilterValue(string value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }

        /// <summary>
        /// Parses the event-log date format used by the UI into a UTC-day range start.
        /// </summary>
        private static bool TryParseDateFilter(string value, out DateTime date)
        {
            if (DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsedDate))
            {
                date = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
                return true;
            }

            date = default;
            return false;
        }

        /// <summary>
        /// Parses the event-log time formats used by the UI, preserving whether seconds were supplied.
        /// </summary>
        private static bool TryParseTimeFilter(string value, out TimeSpan time, out bool hasSeconds)
        {
            var timeFormats = new[] { "h\\:mm", "hh\\:mm", "h\\:mm\\:ss", "hh\\:mm\\:ss" };
            if (TimeSpan.TryParseExact(value, timeFormats, CultureInfo.InvariantCulture, out var parsedTime))
            {
                time = parsedTime;
                hasSeconds = value.Count(character => character == ':') == 2;
                return true;
            }

            time = default;
            hasSeconds = false;
            return false;
        }

    }
}
