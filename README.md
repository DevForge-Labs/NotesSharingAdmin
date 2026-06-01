# NotesSharingAdmin

Admin Dashboard for NotesSharingAPP.

---

# Branch Structure

We use 3 branches:

```text
main      → Stable branch
pratyush  → Pratyush's development branch
apoorva   → Apoorva's development branch
```

### Rules

* Never develop directly on `main`.
* Pratyush works only on `pratyush`.
* Apoorva works only on `apoorva`.
* Only tested code should be merged into `main`.

---

# Switching To Your Branch

## Pratyush

```bash
git checkout pratyush
```

## Apoorva

```bash
git checkout apoorva
```

Verify current branch:

```bash
git branch
```

The active branch will have a `*`.

Example:

```text
* pratyush
  main
  apoorva
```

---

# Making Changes & Pushing To Your Branch

After completing work:

```bash
git add .
git commit -m "Describe your changes"
git push
```

Example:

```bash
git add .
git commit -m "Added upload management UI"
git push
```

---

# Merging Changes Into Main

After testing and verification:

Switch to main:

```bash
git checkout main
```

Merge:

```bash
git merge pratyush
```

or

```bash
git merge apoorva
```

Push:

```bash
git push
```

---

# GitHub Pull Request Method (Recommended)

1. Go to GitHub repository.
2. Open Pull Requests.
3. Click "New Pull Request".
4. Select:

```text
Base Branch: main
Compare Branch: pratyush
```

or

```text
Base Branch: main
Compare Branch: apoorva
```

5. Review changes.
6. Click "Merge Pull Request".
7. Confirm Merge.

This is the safest method.

---

# Updating Main After GitHub Merge

After code has been merged into GitHub's `main`:

```bash
git checkout main
git pull origin main
```

This updates your local main branch.

---

# Updating Your Branch With Latest Main

After main receives new updates:

## Pratyush

```bash
git checkout pratyush
git merge main
git push
```

## Apoorva

```bash
git checkout apoorva
git merge main
git push
```

This keeps your branch up-to-date with the latest stable code.

---

# Getting Teammate's Latest Changes

## Pratyush pulls Apoorva's work

```bash
git checkout pratyush
git fetch
git merge origin/apoorva
git push
```

## Apoorva pulls Pratyush's work

```bash
git checkout apoorva
git fetch
git merge origin/pratyush
git push
```

---

# Daily Workflow

1. Switch to your branch.
2. Pull latest updates.
3. Make changes.
4. Commit.
5. Push.
6. Create Pull Request when feature is complete.
7. Merge into main after testing.
8. Update your branch from main.

---

# Project Rules

✅ Commit frequently

✅ Push frequently

✅ Keep main stable

✅ Use Pull Requests for important features

❌ Do not develop directly on main

❌ Do not force push to main

❌ Do not commit node_modules

❌ Do not merge untested code into main
