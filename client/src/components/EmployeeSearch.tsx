import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

interface Employee {
  id: number;
  employee_no: string;
  name: string;
  department: string;
  designation: string;
  email: string;
}

interface Props {
  onSelect: (employee: Employee) => void;
  selectedEmployee?: Employee | null;
  placeholder?: string;
  filterDepartment?: string;
  filterDesignation?: string;
  label?: string;
}

const EmployeeSearch: React.FC<Props> = ({
  onSelect,
  selectedEmployee,
  placeholder = "Search by name, EC No, or initials...",
  filterDepartment,
  filterDesignation,
  label = "Search Employee",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Employee[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load recent employees on mount
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await api.get("/employees", { params: { active: true, perPage: 10 } });
        setRecentEmployees(res.data.data || []);
      } catch {}
    };
    loadRecent();
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!q || q.length < 1) {
        // If no query but filterDesignation is set, don't show all recent
        if (filterDesignation) {
          setResults([]);
          return;
        }
        setResults(recentEmployees);
        return;
      }
      setSearching(true);
      try {
        const params: any = { search: q, active: true };
        if (filterDepartment) params.department = filterDepartment;
        if (filterDesignation) params.designation = filterDesignation;
        const res = await api.get("/employees", { params });
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [filterDepartment, filterDesignation, recentEmployees],
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (emp: Employee) => {
    onSelect(emp);
    setQuery(`${emp.name} (${emp.employee_no})`);
    setShowResults(false);
  };

  const initialsMatch = (emp: Employee, q: string): boolean => {
    const parts = emp.name.split(/\s+/).filter(Boolean);
    const initials = parts
      .map((p) => p[0])
      .join("")
      .toLowerCase();
    return initials.includes(q.toLowerCase());
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
          if (!e.target.value) onSelect(null as any);
        }}
        onFocus={() => {
          if (!results.length) search(query);
          setShowResults(true);
        }}
        placeholder={placeholder}
      />
      {searching && <span className="form-hint">Searching...</span>}
      {selectedEmployee && !query && (
        <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--primary-accent)", fontWeight: 500 }}>
          ✅ {selectedEmployee.name} — {selectedEmployee.designation} ({selectedEmployee.department})
        </div>
      )}
      {showResults && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--secondary-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1000,
            maxHeight: "280px",
            overflow: "auto",
            marginTop: "4px",
          }}
        >
          {results.map((emp) => {
            const isMatch = query && initialsMatch(emp, query);
            return (
              <div
                key={emp.id}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-color)",
                  background: isMatch ? "var(--nav-hover)" : "transparent",
                }}
                onClick={() => handleSelect(emp)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nav-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontWeight: 500, fontSize: "14px" }}>{emp.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "12px", marginTop: "2px" }}>
                  <span>
                    EC: <strong>{emp.employee_no}</strong>
                  </span>
                  <span>{emp.designation}</span>
                  <span>{emp.department}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeSearch;
