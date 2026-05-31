import { useState, useRef, useEffect } from "react";
import { INDIA_LOCATIONS, STATES } from "@/data/india-locations";

export type LocationValue = { state: string; city: string };

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  required?: boolean;
}

export function LocationPicker({ value, onChange, required }: Props) {
  const [stateOpen, setStateOpen] = useState(false);
  const [stateQ,    setStateQ]    = useState("");
  const [cityOpen,  setCityOpen]  = useState(false);
  const [cityQ,     setCityQ]     = useState("");

  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateOpen(false);
        setStateQ("");
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
        setCityQ("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const filteredStates = STATES.filter((s) =>
    s.toLowerCase().includes(stateQ.toLowerCase())
  );

  const cities: string[] = value.state ? (INDIA_LOCATIONS[value.state] ?? []) : [];
  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(cityQ.toLowerCase())
  );

  function selectState(state: string) {
    onChange({ state, city: "" }); // reset city when state changes
    setStateOpen(false);
    setStateQ("");
  }

  function selectCity(city: string) {
    onChange({ ...value, city });
    setCityOpen(false);
    setCityQ("");
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* ── State ───────────────────────────────────────────────── */}
      <div ref={stateRef} className="relative">
        <label className="block text-sm font-medium mb-1.5">
          State {required && <span className="text-muted-foreground">*</span>}
        </label>
        <button
          type="button"
          onClick={() => { setStateOpen((v) => !v); setCityOpen(false); }}
          className={`w-full px-4 py-3 text-left bg-background border rounded text-sm flex items-center justify-between transition-colors
            ${stateOpen ? "border-primary" : "border-border hover:border-foreground/40"}`}
        >
          <span className={value.state ? "text-foreground" : "text-muted-foreground"}>
            {value.state || "Select state"}
          </span>
          <span className="text-muted-foreground text-xs">▾</span>
        </button>

        {stateOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                value={stateQ}
                onChange={(e) => setStateQ(e.target.value)}
                placeholder="Search state…"
                className="w-full px-3 py-2 bg-background text-sm rounded border border-border focus:outline-none focus:border-primary"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filteredStates.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted-foreground">No results</li>
              ) : filteredStates.map((s) => (
                <li
                  key={s}
                  onMouseDown={() => selectState(s)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${value.state === s
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"}`}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── City ────────────────────────────────────────────────── */}
      <div ref={cityRef} className="relative">
        <label className="block text-sm font-medium mb-1.5">
          City {required && <span className="text-muted-foreground">*</span>}
        </label>
        <button
          type="button"
          disabled={!value.state}
          onClick={() => { setCityOpen((v) => !v); setStateOpen(false); }}
          className={`w-full px-4 py-3 text-left bg-background border rounded text-sm flex items-center justify-between transition-colors
            ${!value.state
              ? "opacity-40 cursor-not-allowed border-border"
              : cityOpen
                ? "border-primary"
                : "border-border hover:border-foreground/40"}`}
        >
          <span className={value.city ? "text-foreground" : "text-muted-foreground"}>
            {value.city || (value.state ? "Select city" : "Select state first")}
          </span>
          <span className="text-muted-foreground text-xs">▾</span>
        </button>

        {cityOpen && cities.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                value={cityQ}
                onChange={(e) => setCityQ(e.target.value)}
                placeholder="Search city…"
                className="w-full px-3 py-2 bg-background text-sm rounded border border-border focus:outline-none focus:border-primary"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filteredCities.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted-foreground">No results</li>
              ) : filteredCities.map((c) => (
                <li
                  key={c}
                  onMouseDown={() => selectCity(c)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${value.city === c
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"}`}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
