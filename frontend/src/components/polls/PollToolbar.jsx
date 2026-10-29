import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Input, Select } from "../ui/Field";
import { SegmentedControl } from "../ui/SegmentedControl";

/**
 * Search + filter + sort controls shared by the Polls and Results pages.
 * `filters` is optional: [{ value, label, count }].
 */
export function PollToolbar({ search, onSearch, filters, filter, onFilter, sortOptions, sort, onSort }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {filters && filters.length > 0 ? (
        <SegmentedControl options={filters} value={filter} onChange={onFilter} ariaLabel="Filter polls" />
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 md:w-64 md:flex-none">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search polls…"
            aria-label="Search polls"
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-fg"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {sortOptions && (
          <Select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort polls" className="w-44 shrink-0">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
}
