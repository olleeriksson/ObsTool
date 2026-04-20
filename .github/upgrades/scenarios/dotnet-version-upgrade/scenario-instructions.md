# .NET Version Upgrade — Scenario Instructions

## Strategy
**Selected**: All-At-Once  
**Rationale**: 2 projects with simple linear dependency, low upgrade complexity, straightforward package bumps and ASP.NET Core API fixes

### Execution Constraints
- All projects updated simultaneously in a single atomic operation
- Single pass: update TFMs → update packages → fix compilation errors → verify build
- No per-tier validation — full solution validation after atomic upgrade completes
- Testing validates the complete upgraded solution

## Preferences
- **Flow Mode**: Automatic
- **Commit Strategy**: After Each Task
- **Pace**: Standard
- **Target Framework**: .NET 10.0 LTS

## Decisions
- Strategy selected based on: 2 projects, simple dependency, low-complexity upgrade

## Custom Instructions
<!-- Task-specific overrides: "For {taskId}: {instruction}" -->
