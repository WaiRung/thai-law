# Question ID Filters

This directory contains JSON files that define which questions are allowed to be displayed for each category.

## Structure

Each JSON file should follow this format:

```json
{
  "categoryId": "category-identifier",
  "allowedQuestionIds": [
    "question-id-1",
    "question-id-2",
    "question-id-3"
  ]
}
```

## Question ID Formats

The filter system supports two types of question IDs:

### 1. Full Section IDs
Format: `"มาตรา X"`

Example: `"มาตรา 1"`, `"มาตรา 2"`

This allows the entire section to be displayed as a single flashcard.

### 2. Subsection IDs
Format: `"มาตรา X อนุ Y"`

Example: `"มาตรา 1 อนุ 1"`, `"มาตรา 1 อนุ 5"`

This allows specific subsections within a section to be displayed as individual flashcards. Each subsection card will show:
- **Question**: `มาตรา X อนุ Y`
- **Answer**: The specific subsection content

### Mixing Full Sections and Subsections

You can mix both formats in the same filter:

```json
{
  "categoryId": "กฎหมายอาญา",
  "allowedQuestionIds": [
    "มาตรา 1 อนุ 1",
    "มาตรา 1 อนุ 5",
    "มาตรา 2",
    "มาตรา 3 อนุ 7"
  ]
}
```

This would show:
- Subsection 1 of Section 1 (as a separate card)
- Subsection 5 of Section 1 (as a separate card)
- Full Section 2 (with all its content)
- Subsection 7 of Section 3 (as a separate card)

## Adding a New Category Filter

1. **Create a new JSON file** named after the category (e.g., `civil-procedure.json`)
2. **Set the `categoryId`** to match the category ID used in `categoryStores.ts`
3. **List all allowed question IDs** in the `allowedQuestionIds` array
4. **Import the filter** in `src/services/filterService.ts`:
   ```typescript
   import myNewFilter from "../filters/my-new-filter.json";
   ```
5. **Add to the categoryFilters mapping**:
   ```typescript
   const categoryFilters: Record<string, QuestionFilter> = {
     "existing-category": existingFilter,
     "my-category-id": myNewFilter,  // Add your new filter here
   };
   ```
6. The filter will be automatically loaded when the category is accessed

## File Naming Convention

- Use lowercase names with hyphens for multi-word categories
- Match the semantic meaning of the category (e.g., `civil.json` for civil law)
- The file name should be descriptive but doesn't need to exactly match the category ID

## Current Filters

- `civil.json` - Civil & Commercial Law (กฎหมายแพ่ง)
- `criminal.json` - Criminal Law (กฎหมายอาญา)

## How It Works

When a category is loaded:
1. The filter service checks if a filter is defined for the category
2. The allowed IDs are stored in a Set for O(1) lookup performance
3. Questions are filtered to only show those with IDs in the allowed list
4. If no filter exists for a category, all questions for that category are shown
5. Filters are cached after first load for improved performance

## Performance Considerations

- **Sets are used for efficient ID lookup**, especially important for large lists (O(1) lookup time)
- **Filters are loaded synchronously** on application startup (statically imported)
- **IDs can be reused** across multiple categories if needed
- **Caching** - Once a filter is loaded and converted to a Set, it's cached in memory

## Example Use Case

If you want to create a practice mode that only shows specific questions:

1. Create `practice-mode-civil.json`:
   ```json
   {
     "categoryId": "กฎหมายแพ่ง",
     "allowedQuestionIds": ["มาตรา 1", "มาตรา 5"]
   }
   ```
2. Import and add to filterService.ts
3. The Civil Law category will now only show 2 questions instead of all 6

## Technical Details

- Location: `src/filters/`
- Service: `src/services/filterService.ts`
- Type Definition: `src/types/flashcard.ts` (QuestionFilter interface)
- Integration: `src/views/FlashcardView.vue` (calls filterQuestions on category load)

