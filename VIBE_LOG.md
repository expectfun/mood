## 2025-12-06

### 21:15 UTC
**User**
Read @spec.md
- Tags: [request, spec]

### 21:15 UTC
**Assistant**
Read spec.md and ready to help. Updated VIBE_LOG.md.
- Tags: [ack, log]

### 21:16 UTC
**User**
Based on @spec.md , create plan.md with implementation plan
- Tags: [request, planning]

### 21:16 UTC
**Assistant**
Added implementation roadmap in plan.md aligned to spec (setup, DB, import, flows, search, validation, logging, ops) and logged exchange.
- Tags: [plan, log]

### 21:19 UTC
**User**
Implement the project based on the plan and spec.
- Tags: [request, build]

### 21:19 UTC
**Assistant**
Implemented project scaffold (Bun+TS), SQLite schema, repository helpers, importer script, Telegram bot with flows (/start, /status, /profile, /update, /search, /help), inline keyboards, validation, logging, runbook, and env template references.
- Tags: [build, log]

### 21:24 UTC
**User**
@zsh (12-14) Seems you got your own script syntax wrong?
- Tags: [bug, import]

### 21:24 UTC
**Assistant**
Fixed import script to accept both `--url <...>` / `--file <...>` and equals forms; updated README and RUNBOOK to clarify usage.
- Tags: [fix, import, docs, log]

### 22:00 UTC
**User**
On the browse / search page, when listing a name of an attendee, make it a link to their Telegram profile: http://t.me/USERNAME (where USERNAME is their Telegram handle)
- Tags: [request, search, ux]

### 22:00 UTC
**Assistant**
Updated search results cards to append `https://t.me/<username>` after the attendee name when a Telegram handle is present.
- Tags: [fix, search, ux, log]

### 22:02 UTC
**User**
Change that link format from https://t.me/USERNAME to @ followed by that USERNAME (without a space)
- Tags: [request, search, ux]

### 22:02 UTC
**Assistant**
Adjusted search result name line to show `@username` instead of the full t.me URL when a Telegram handle exists.
- Tags: [fix, search, ux, log]

### 22:06 UTC
**User**
On the browse/search page, remove the "updated" line. Also, make the name in bold font
- Tags: [request, search, ux]

### 22:06 UTC
**Assistant**
Removed the "Updated" line from search cards and bolded the name line while keeping the handle inline.
- Tags: [fix, search, ux, log]

### 22:21 UTC
**User**
Bold font didn't work out, turn it off
- Tags: [request, search, ux]

### 22:21 UTC
**Assistant**
Removed bold styling from search result name line; now plain text with status emoji and @handle.
- Tags: [fix, search, ux, log]

### 22:33 UTC
**User**
On the browse / search results page, remove descriptions like "Green (open)" under the colored emojis. Emojis speak for themselves. 
- Tags: [request, search, ux]

### 22:33 UTC
**Assistant**
Search cards no longer show the status description line when no custom note is set; only custom status text appears if provided.
- Tags: [fix, search, ux, log]

### 22:34 UTC
**User**
Can you see console output? What's the problem?
- Tags: [request, debugging]

### 22:34 UTC
**Assistant**
Observed Telegram API error `ETELEGRAM 400 ... query is too old/invalid` when answering stale callback queries (likely after restarts). Added guard around `answerCallbackQuery` to ignore stale/invalid queries, inform user to tap again, and added polling/unhandled rejection logging.
- Tags: [fix, telegram, error-handling, log]

### 22:39 UTC
**User**
On the "set status" page (opened by /status), add a brief explaining text, stating that green means "talk to me freely", yellow means "open to some kind of talk", and red means "currently not open to talking"
- Tags: [request, status, ux]

### 22:39 UTC
**Assistant**
Added brief color legend to the status view (/status): Green = talk freely, Yellow = open to some kinds of talk, Red = not open to talking.
- Tags: [fix, status, ux, log]

### 22:44 UTC
**User**
Currently on the search / browse page, a user can send a message to act as a search query, but how that search query can be reset after, to see all the users again with no query at all?
- Tags: [request, search, ux]

### 22:44 UTC
**Assistant**
Added a “Clear query” button to search results; it resets the text filter and page to show all users. Updated instructions in search view accordingly.
- Tags: [fix, search, ux, log]

### 22:45 UTC
**User**
Add also a clarifying text at the top of that page, explaining that user can send a message to search for a specific word in other people's profiles. It's not intuitively obvious
- Tags: [request, search, ux]

### 22:45 UTC
**Assistant**
Added top-of-page hint on search/browse explaining you can send a word to filter by name/role/skills/looking for, and to use “Clear query” to reset.
- Tags: [fix, search, ux, log]

### 22:48 UTC
**User**
Currently a user can see some of other user profile fields, but not all, do I get it right? Don't change the project, just answer 
- Tags: [question, search, ux]

### 22:48 UTC
**Assistant**
Yes: the browse/search cards show a subset (status emoji and @handle/name, optional status note, bio if present, skills, and looking_for). They do not show full details like email/LinkedIn/startup fields. The full profile view is only for the current user via My Profile.
- Tags: [answer, search, ux, log]

### 22:49 UTC
**User**
It would be better to have a convenient way of seeing the whole profile of other user, but without cluttering the search results page with all the fields. Do you have a suggestion? Don't implement it yet, just suggest
- Tags: [request, search, ux]

### 22:49 UTC
**Assistant**
Suggested adding a “View profile” inline button on each search card that opens a separate detailed message (or replaces the message) with the full profile fields plus a Back button to return to the search list—keeping the list concise while offering one-tap detail access.
- Tags: [suggestion, search, ux, log]

### 22:51 UTC
**User**
git commit the current version, then implement your suggestion
- Tags: [request, git, feature]

### 22:51 UTC
**Assistant**
Committed current state. Implemented “View profile” flow in search results: each card now has a View button that opens a full-profile message with a back-to-results button; added public profile formatter and repo lookup by id, updated search keyboards accordingly.
- Tags: [commit, feature, search, ux, log]

