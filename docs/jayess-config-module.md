# `jayess:config` Module

`jayess:config` loads small configuration files through existing Jayess standard-library parsers. It is a convenience module, not a new parser runtime.

## Surface

- `load(path)`
- `loadSync(path)`
- `loadJson(path)`
- `loadJsonSync(path)`
- `loadToml(path)`
- `loadTomlSync(path)`
- `loadIni(path)`
- `loadIniSync(path)`
- `loadDotenv(path)`
- `loadDotenvSync(path)`
- `merge(base, override)`
- `get(config, key, fallback)`
- `requireKey(config, key)`

## Format Selection

`load(path)` and `loadSync(path)` select a parser from the lowercase extension:

- `.json` uses `jayess:json`
- `.toml` uses `jayess:toml`
- `.ini` uses `jayess:ini`
- `.env` uses `jayess:dotenv`

Unknown extensions throw a Jayess runtime value.

## Async And Sync Naming

Default load helpers are async and return Jayess async handles. Use `await load(path)` to consume them.

`Sync` helpers read and parse directly.

## Merge And Lookup

`merge(base, override)` performs a shallow deterministic overlay. Keys from `override` replace keys from `base`.

`get(config, key, fallback)` returns `fallback` when the key is missing and returns the stored value otherwise.

`requireKey(config, key)` returns the stored value or throws a Jayess runtime value when the key is missing.
