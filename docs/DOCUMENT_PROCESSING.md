# Document Processing Design

> **Status: design only. Nothing here is implemented yet.** The first version accepts **text only**.

This page describes what happens when data enters the notes.

## What is accepted

Everything is stored as an original. Only some inputs become searchable.

| Tier | Formats | Result |
|---|---|---|
| **A: native text** | `.txt` `.md` `.json` `.csv` `.html` `.xml`, source code, and notes written through the API | Stored, read directly, fully searchable. **First version.** |
| **B: needs an extractor** | PDF, DOCX, images (OCR), audio (transcription), video | Later. Original stored, text extracted, then searchable. |
| **C: stored only** | Other safe files | Original kept, marked `unprocessed`, not searchable. |

Rejected outright: executables, oversized input, and anything whose real content does not match its stated type. Check the actual bytes, not only the file name.

Build order after text: PDF and DOCX, then images, then audio, then video.

## Pipeline for a text entry

1. **Validate.** Valid UTF-8, not empty, under the size limit *(proposed: 100 KB per note)*, and a secrets scan (see `SECURITY.md`).
2. **Fingerprint.** SHA-256 of the normalized content. If the same hash already exists in the project, do not create a duplicate.
3. **Store the original** exactly as received. It is never modified.
4. **Create the record** with its metadata. Writes from AI keys always start as `draft`.
5. **Normalize** a working copy: consistent line endings, trimmed whitespace. The original stays separate.
6. **Chunk.** Split at headings or paragraphs into pieces of roughly 300 to 800 words *(proposed)*, with a small overlap.
7. **Add context to every chunk.** Each chunk keeps its note title, heading path and the note summary, and points to its parent note. A chunk saying "it fails there" is useless without knowing what "it" and "there" are.
8. **Index** the chunks for full-text search.
9. **Set status** to `ready`, or `failed` with a reason.

## Editing

An edit runs steps 1, 2 and 5 to 9 again on the new text and stores a new version with a `change_note`. The previous version is kept.

## Retries

A failed job can be retried without creating duplicate records. Processing is keyed by note ID, version and content hash, so running it twice gives the same result.

## Failure handling

- Invalid or unsupported input is rejected with a clear message, never silently altered.
- A failed chunking or indexing step leaves the note stored with status `failed`, so the original is never lost.
- Failures are written to the audit log.

## Summaries

Summaries are an extra layer for scanning. They never replace the original text.

## Not decided yet

- Who writes the `title` and `summary` when a caller does not supply them (a model, or the caller).
- Exact chunk size and overlap, to be tuned using real questions and the retrieval test set.
