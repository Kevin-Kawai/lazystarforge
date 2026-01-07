# Delete Project Feature - Testing Checklist

## Implementation Complete ✓

All phases have been implemented and committed:
- ✅ Phase 1: UI Layer (DeleteProjectModal, key handlers, state management)
- ✅ Phase 2: Use Case Layer (DeleteProjectUseCase with cascade deletion)
- ✅ Phase 3: Repository Layer (ProjectRepository.delete method)

## Files Created/Modified

### New Files
- `src/view/modals/DeleteProjectModal.ts` - Confirmation modal with cascade warning
- `src/usecase/deleteProjectUseCase.ts` - Business logic for cascade deletion

### Modified Files
- `src/view/handlers/ProjectsListHandlers.ts` - Added 'd' key handler
- `src/view/App.ts` - Wired up delete flow with state management
- `src/repository/projectRepository.ts` - Added delete method

## Manual Testing Checklist

### Basic Functionality
- [ ] Press 'd' on projects list - modal appears
- [ ] Modal shows project name
- [ ] Modal shows cascade warning in yellow
- [ ] Press 'y' - project and all sessions deleted
- [ ] Press 'n' - deletion canceled
- [ ] Press 'escape' - deletion canceled
- [ ] Press 'q' - deletion canceled

### Cascade Deletion
- [ ] Create project with 3+ sessions
- [ ] Delete project
- [ ] Verify all session files removed from disk
- [ ] Verify project file removed from disk

### Edge Cases
- [ ] Delete project with 0 sessions - works correctly
- [ ] Delete last remaining project - UI shows welcome screen
- [ ] Try to delete with no project selected - nothing happens
- [ ] Delete project, then verify it's removed from list

### State Management
- [ ] After deletion, selectedProjectName updates to next project
- [ ] After deletion, selectedSessionId is cleared
- [ ] Sessions list refreshes and shows sessions from new project (or empty)
- [ ] Transcript refreshes appropriately
- [ ] Focus returns to projects list

### Error Handling
- [ ] Delete project where session file doesn't exist - logs warning but continues
- [ ] Delete project where project file doesn't exist - error logged
- [ ] Partial deletion scenario - some sessions fail but project still deleted

## Integration Test Commands

```bash
# Build the project
npm run build

# Run the application
npm start

# Test manually using the UI
# 1. Create a test project
# 2. Create 2-3 sessions in that project
# 3. Press 'd' to delete
# 4. Confirm with 'y'
# 5. Verify files removed
```

## File Verification

After deleting a project named "test-project" with sessions:

```bash
# Check project file is gone
ls ~/.local/share/lazystarforge/projects/test-project.json
# Should return: No such file or directory

# Check session files are gone
ls ~/.local/share/lazystarforge/sessions/
# Should not contain session IDs that belonged to test-project
```

## Code Review Checklist

- [x] Modal follows same pattern as DeleteSessionModal
- [x] Use case follows same pattern as DeleteSessionUseCase
- [x] Repository delete follows same pattern as SessionRepository.delete
- [x] Error handling uses Promise.allSettled for graceful partial failures
- [x] State management clears both selectedProjectName and selectedSessionId
- [x] All UI refresh functions called in correct order
- [x] TypeScript types are correct
- [x] Imports are properly organized

## Known Limitations

1. No undo functionality - deletion is permanent
2. No progress indicator for large projects with many sessions
3. No confirmation dialog that requires typing project name
4. No database transactions - partial failures possible

## Future Enhancements

See implementation plan resource for future enhancement ideas:
- Undo/archive functionality
- Bulk deletion
- Progress indicator for large projects
- Type-to-confirm for extra safety
