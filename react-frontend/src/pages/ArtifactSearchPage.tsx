import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Artifact } from "../types/artifact";
import { getArtifacts, getAllArtifacts } from "../api/artifactApi";
import { Category } from "../types/category";
import "./ArtifactSearchPage.css";

// Type for paginated API response
type ArtifactApiResponse = {
  data: Artifact[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

// 1. Define types for filter state
type FilterState = {
  searchTerm: string;
  ProgrammingLanguage: string[];
  Framework: string[];
  LicenseType: string[];
  CategoryId: number | null;
  Type: number | null;
  sortBy: string;
  sortDescending: boolean;
  pageNumber: number;
  pageSize: number;
};

// 2. Modal for artifact detail
const ArtifactDetailModal: React.FC<{
  artifact: Artifact | null;
  onClose: () => void;
}> = ({ artifact, onClose }) => {
  if (!artifact) return null;
  return (
    <div className="artifact-modal-backdrop" onClick={onClose}>
      <div className="artifact-modal" onClick={e => e.stopPropagation()}>
        <button className="artifact-modal-close" onClick={onClose}>×</button>
        <h2>{artifact.title}</h2>
        <p>{artifact.description}</p>
        <p>
          <b>URL:</b> <a href={artifact.url} target="_blank" rel="noopener noreferrer">{artifact.url}</a>
        </p>
        <p><b>Type:</b> {artifact.type}</p>
        <p><b>Programming Language:</b> {artifact.programmingLanguage}</p>
        <p><b>Framework:</b> {artifact.framework}</p>
        <p><b>License Type:</b> {artifact.licenseType}</p>
        <p><b>Category:</b> {artifact.category?.name ?? artifact.categoryId}</p>
        <p><b>Author:</b> {artifact.author}</p>
        <p><b>Version:</b> {artifact.version}</p>
        <p><b>Created:</b> {new Date(artifact.created).toLocaleString()}</p>
      </div>
    </div>
  );
};

function extractUnique<T>(arr: T[], key: keyof T): string[] {
  return Array.from(new Set(arr.map(item => String(item[key])).filter(Boolean)));
}

// TS-safe version: first filter for numbers, then deduplicate
function extractUniqueNumber<T>(arr: T[], key: keyof T): number[] {
  const numbers: number[] = [];
  for (const item of arr) {
    const value = item[key];
    if (typeof value === "number" && !numbers.includes(value)) {
      numbers.push(value);
    }
  }
  return numbers;
}

// Only extract id and name for categories to prevent TS errors
function extractCategories(arr: Artifact[]): Pick<Category, 'id' | 'name'>[] {
  const seen = new Map<number, Pick<Category, 'id' | 'name'>>();
  arr.forEach(artifact => {
    if (
      artifact.categoryId !== undefined &&
      artifact.categoryId !== null &&
      artifact.category !== undefined
    ) {
      seen.set(artifact.categoryId, { id: artifact.categoryId, name: artifact.category.name });
    }
  });
  return Array.from(seen.values());
}

// 4. Main Search Page Component
const ArtifactSearchPage: React.FC = () => {
  const { auth } = useAuth();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    ProgrammingLanguage: [],
    Framework: [],
    LicenseType: [],
    CategoryId: null,
    Type: null,
    sortBy: "created",
    sortDescending: true,
    pageNumber: 1,
    pageSize: 10,
  });

  // Available filter values
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableFrameworks, setAvailableFrameworks] = useState<string[]>([]);
  const [availableLicenseTypes, setAvailableLicenseTypes] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Pick<Category, 'id' | 'name'>[]>([]);
  const [availableTypes, setAvailableTypes] = useState<number[]>([]);

  // Artifacts & pagination
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // On mount, fetch all artifacts for extracting filter options
  useEffect(() => {
    if (!auth.accessToken) return;
    getAllArtifacts(auth.accessToken).then(allArtifacts => {
      setAvailableLanguages(extractUnique(allArtifacts, "programmingLanguage"));
      setAvailableFrameworks(extractUnique(allArtifacts, "framework"));
      setAvailableLicenseTypes(extractUnique(allArtifacts, "licenseType"));
      setAvailableTypes(extractUniqueNumber(allArtifacts, "type"));
      setAvailableCategories(extractCategories(allArtifacts));
    });
    // eslint-disable-next-line
  }, [auth.accessToken]);

  // Fetch artifacts on filters/page change
  useEffect(() => {
    if (!auth.accessToken) return;
    setLoading(true);
    // Prepare query for API
    const query = {
      ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
      ...(filters.ProgrammingLanguage.length > 0 && { ProgrammingLanguage: filters.ProgrammingLanguage }),
      ...(filters.Framework.length > 0 && { Framework: filters.Framework }),
      ...(filters.LicenseType.length > 0 && { LicenseType: filters.LicenseType }),
      ...(filters.CategoryId !== null && { CategoryId: filters.CategoryId }),
      ...(filters.Type !== null && { Type: filters.Type }),
      sortBy: filters.sortBy,
      sortDescending: filters.sortDescending,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    };

    getArtifacts(query, auth.accessToken)
      .then((result: ArtifactApiResponse | Artifact[]) => {
        if (Array.isArray(result)) {
          // Fallback for old API: just set artifacts and estimate count
          setArtifacts(result);
          setTotalCount(
            result.length < filters.pageSize && filters.pageNumber === 1
              ? result.length
              : filters.pageNumber * filters.pageSize +
                  (result.length === filters.pageSize ? 1 : 0)
          );
        } else {
          setArtifacts(result.data);
          setTotalCount(result.pagination.totalCount);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [filters, auth.accessToken]);

  // Multi-checkbox helper
  const handleMultiCheckbox = (field: "ProgrammingLanguage" | "Framework" | "LicenseType", value: string) => {
    setFilters(prev => {
      const values = prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value];
      return { ...prev, [field]: values, pageNumber: 1 };
    });
  };

  // Paging
  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  return (
    <div className="artifact-search-page">
      {/* Header: search + sort */}
      <div className="artifact-search-header">
        <input
          type="text"
          placeholder="Search by title, description, or URL..."
          value={filters.searchTerm}
          onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value, pageNumber: 1 }))}
          className="artifact-search-bar"
        />
        <select
          value={filters.sortBy}
          onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value, pageNumber: 1 }))}
        >
          <option value="created">Date</option>
          <option value="title">Title</option>
        </select>
        <button
          onClick={() => setFilters(f => ({ ...f, sortDescending: !f.sortDescending }))}
        >
          {filters.sortDescending ? "↓" : "↑"}
        </button>
      </div>

      <div className="artifact-search-content">
        {/* Sidebar: Filters */}
        <aside className="artifact-search-filters">
          <div className="filter-group">
            <span className="filter-label">Programming Language</span>
            {availableLanguages.map(l => (
              <label key={l}>
                <input
                  type="checkbox"
                  checked={filters.ProgrammingLanguage.includes(l)}
                  onChange={() => handleMultiCheckbox("ProgrammingLanguage", l)}
                />
                {l}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <span className="filter-label">Framework</span>
            {availableFrameworks.map(fw => (
              <label key={fw}>
                <input
                  type="checkbox"
                  checked={filters.Framework.includes(fw)}
                  onChange={() => handleMultiCheckbox("Framework", fw)}
                />
                {fw}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <span className="filter-label">License Type</span>
            {availableLicenseTypes.map(lt => (
              <label key={lt}>
                <input
                  type="checkbox"
                  checked={filters.LicenseType.includes(lt)}
                  onChange={() => handleMultiCheckbox("LicenseType", lt)}
                />
                {lt}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <span className="filter-label">Category</span>
            <select
              value={filters.CategoryId ?? ""}
              onChange={e => setFilters(f => ({
                ...f,
                CategoryId: e.target.value ? Number(e.target.value) : null,
                pageNumber: 1
              }))}
            >
              <option value="">Any</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Type</span>
            <select
              value={filters.Type ?? ""}
              onChange={e => setFilters(f => ({
                ...f,
                Type: e.target.value ? Number(e.target.value) : null,
                pageNumber: 1
              }))}
            >
              <option value="">Any</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Artifact results */}
        <main className="artifact-search-results">
          {loading && <div>Loading...</div>}
          {!loading && artifacts.length === 0 && <div>No artifacts found.</div>}
          <div className="artifact-card-list">
            {artifacts.map(a => (
              <div key={a.id} className="artifact-card" onClick={() => setSelectedArtifact(a)}>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
                <div>
                  <span>{a.programmingLanguage}</span> | <span>{a.framework}</span>
                </div>
                <div>
                  <span>{a.licenseType}</span> | <span>v{a.version}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="artifact-pagination">
              <button
                disabled={filters.pageNumber <= 1}
                onClick={() => setFilters(f => ({ ...f, pageNumber: f.pageNumber - 1 }))}
              >
                Previous
              </button>
              <span>
                Page {filters.pageNumber} of {totalPages}
              </span>
              <button
                disabled={filters.pageNumber >= totalPages}
                onClick={() => setFilters(f => ({ ...f, pageNumber: f.pageNumber + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
      {/* Artifact modal */}
      <ArtifactDetailModal artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
    </div>
  );
};

export default ArtifactSearchPage;

/*
WHAT THIS FILE DOES:
- Lays out the page with a header (search/sort), sidebar (filters), and a main area (artifact cards, pagination)
- Fetches all artifacts on mount to extract filter options client-side
- Filters, sorts, and paginates artifacts via backend API
- Handles filter changes, pagination, and sorting
- Shows a modal window with full artifact details when a card is clicked
- Uses checkboxes for multi-select filters (language, framework, license)
- Uses dropdowns for category and type
- Handles loading and no-results states
*/