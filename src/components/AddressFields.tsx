"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { LOCALITY_STREET_CODE, searchKey, type City, type Street } from "@/lib/il-address/dataset";
import { detailErrors, type AddressErrors, type AddressInput, type CustomerAddress } from "@/lib/il-address/validate";
/**
 * The structured Israeli address fields (admin customers and checkout): city and street are
 * picked from the official lists (never free text), street unlocks only after
 * a city is chosen. The server re-checks everything (validateAddress).
 */

const inputClass = "w-full rounded-xl bg-paper px-3.5 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500";

type Option = { code: number; name: string };

export interface AddressDraft {
  city: City | null;
  cityText: string;
  street: Street | null;
  streetText: string;
  /** The chosen locality has no street names (kibbutz, small village). */
  streetless: boolean;
  houseNumber: string;
  floor: string;
  entrance: string;
}

export const EMPTY_ADDRESS: AddressDraft = { city: null, cityText: "", street: null, streetText: "", streetless: false, houseNumber: "", floor: "", entrance: "" };

export function draftFromAddress(a: CustomerAddress | null | undefined): AddressDraft {
  if (!a) return EMPTY_ADDRESS;
  const streetless = a.streetCode === LOCALITY_STREET_CODE;
  return {
    city: { code: a.cityCode, name: a.city },
    cityText: a.city,
    street: streetless ? null : { code: a.streetCode, name: a.street },
    streetText: streetless ? "" : a.street,
    streetless,
    houseNumber: a.houseNumber,
    floor: a.floor ?? "",
    entrance: a.entrance ?? "",
  };
}

/** The form's own check, before the server is asked. */
export function draftErrors(d: AddressDraft): AddressErrors {
  const errors = detailErrors(d);
  if (!d.city) errors.city = d.cityText.trim() ? "יש לבחור עיר מהרשימה. אי אפשר להקליד עיר שאינה ברשימה הרשמית." : "נא לבחור עיר.";
  else if (!d.street && !d.streetless) {
    errors.street = d.streetText.trim() ? `יש לבחור רחוב מרשימת הרחובות של ${d.city.name}.` : "נא לבחור רחוב.";
  }
  return errors;
}

export const draftToInput = (d: AddressDraft): AddressInput => ({
  cityCode: d.city?.code,
  city: d.city?.name ?? d.cityText,
  streetCode: d.street?.code,
  street: d.street?.name ?? (d.streetless ? "" : d.streetText),
  houseNumber: d.houseNumber,
  floor: d.floor,
  entrance: d.entrance,
});

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

// Loaded once per page visit and shared by every form on the screen.
let citiesRequest: Promise<City[]> | null = null;
const loadCities = () =>
  (citiesRequest ??= getJson<{ cities: City[] }>("/api/address/cities")
    .then((r) => r.cities)
    .catch((err) => {
      citiesRequest = null; // retry on the next mount
      throw err;
    }));

const streetRequests = new Map<number, Promise<Street[]>>();
function loadStreets(cityCode: number) {
  let request = streetRequests.get(cityCode);
  if (!request) {
    request = getJson<{ streets: Street[] }>(`/api/address/streets?city=${cityCode}`)
      .then((r) => r.streets)
      .catch((err) => {
        streetRequests.delete(cityCode);
        throw err;
      });
    streetRequests.set(cityCode, request);
  }
  return request;
}

export function AddressFields({ value, onChange, errors, hideLegend }: { value: AddressDraft; onChange: (next: AddressDraft) => void; errors: AddressErrors; /** When the surrounding section already has a visible heading. */ hideLegend?: boolean }) {
  const [cities, setCities] = useState<City[] | null>(null);
  const [citiesFailed, setCitiesFailed] = useState(false);
  /** Streets of the chosen city; null while loading or with no city. */
  const [streets, setStreets] = useState<Street[] | null>(null);
  const [streetsFailed, setStreetsFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The latest draft, for the async callbacks below.
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    let live = true;
    setCitiesFailed(false);
    loadCities().then(
      (list) => live && setCities(list),
      () => live && setCitiesFailed(true),
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  const cityCode = value.city?.code;
  useEffect(() => {
    setStreets(null);
    setStreetsFailed(false);
    if (cityCode === undefined) return;
    let live = true;
    loadStreets(cityCode).then(
      (list) => {
        if (!live) return;
        setStreets(list);
        const d = latest.current;
        const streetless = list.length === 0;
        if (d.streetless !== streetless) onChange({ ...d, streetless, ...(streetless && { street: null, streetText: "" }) });
      },
      () => live && setStreetsFailed(true),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is read when the request settles
  }, [cityCode, attempt]);

  const retry = (
    <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-bold underline">
      ניסיון נוסף
    </button>
  );
  const streetless = !!value.city && value.streetless && streets?.length === 0;

  return (
    <fieldset className="@container space-y-4">
      <legend className={hideLegend ? "sr-only" : "font-display text-lg font-bold"}>כתובת</legend>
      {/* By the form's own width: one column inside the narrow customer drawer. */}
      <div className="grid gap-4 @md:grid-cols-2">
        <Combobox
          label="עיר / יישוב"
          required
          options={cities ?? []}
          selected={value.city}
          text={value.cityText}
          onChange={(cityText, city) => {
            // A different city invalidates the street that was picked for the old one.
            const same = city && value.city && city.code === value.city.code;
            onChange(same ? { ...value, cityText, city } : { ...value, cityText, city, street: null, streetText: "", streetless: false });
          }}
          loading={!cities && !citiesFailed}
          placeholder="הקלידו שם עיר ובחרו מהרשימה"
          emptyText="לא נמצא יישוב כזה ברשימה הרשמית"
          error={errors.city}
          note={citiesFailed ? <>רשימת היישובים לא נטענה. {retry}</> : undefined}
        />
        {streetless ? (
          <div className="space-y-1">
            <span className="block text-sm font-medium">רחוב</span>
            <p className={`${inputClass} bg-cream text-muted`}>ביישוב {value.city!.name} אין שמות רחובות</p>
            <span className="block text-xs text-muted">ממשיכים ישר למספר הבית.</span>
          </div>
        ) : (
          <Combobox
            label="רחוב"
            required
            options={streets ?? []}
            selected={value.street}
            text={value.streetText}
            onChange={(streetText, street) => onChange({ ...value, streetText, street })}
            disabled={!value.city || !streets}
            loading={!!value.city && !streets && !streetsFailed}
            placeholder={value.city ? `הקלידו שם רחוב ב${value.city.name}` : "קודם בוחרים עיר"}
            emptyText={`לא נמצא רחוב כזה ב${value.city?.name ?? ""}`}
            error={errors.street}
            note={streetsFailed ? <>רשימת הרחובות לא נטענה. {retry}</> : undefined}
          />
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TextField label="מספר בית" required value={value.houseNumber} onChange={(houseNumber) => onChange({ ...value, houseNumber })} error={errors.houseNumber} placeholder="12א" maxLength={9} />
        <TextField label="קומה" value={value.floor} onChange={(floor) => onChange({ ...value, floor })} error={errors.floor} placeholder="3 / קרקע" maxLength={12} />
        <TextField label="כניסה" value={value.entrance} onChange={(entrance) => onChange({ ...value, entrance })} error={errors.entrance} placeholder="א" maxLength={3} />
      </div>
    </fieldset>
  );
}

const Required = () => (
  <span aria-hidden className="text-brand-600"> *</span>
);

function TextField({ label, required, value, onChange, error, placeholder, maxLength }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; maxLength?: number }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? <Required /> : <span className="font-normal text-muted"> (לא חובה)</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${error ? "ring-brand-600" : ""}`}
      />
      {error && <span id={`${id}-error`} role="alert" className="block text-xs text-brand-700">{error}</span>}
    </div>
  );
}

const MAX_SHOWN = 60;

/** Options whose name contains the query; names that start with it come first. */
function filterOptions<T extends Option>(options: T[], query: string): T[] {
  const q = searchKey(query);
  if (!q) return options.slice(0, MAX_SHOWN);
  const starts: T[] = [];
  const contains: T[] = [];
  for (const o of options) {
    const key = searchKey(o.name);
    if (key.startsWith(q)) starts.push(o);
    else if (key.includes(q)) contains.push(o);
  }
  return [...starts, ...contains].slice(0, MAX_SHOWN);
}

/**
 * A searchable dropdown that only ever yields a value from `options`: typing
 * filters the list and clears the selection, so free text is never a value.
 */
function Combobox<T extends Option>({
  label,
  required,
  options,
  selected,
  text,
  onChange,
  disabled,
  loading,
  placeholder,
  emptyText,
  error,
  note,
}: {
  label: string;
  required?: boolean;
  options: T[];
  selected: T | null;
  text: string;
  onChange: (text: string, selected: T | null) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  emptyText: string;
  error?: string;
  note?: React.ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  // With a value selected, opening the list shows everything again rather than just that value.
  const shown = useMemo(() => filterOptions(options, selected ? "" : text), [options, selected, text]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const pick = (option: T) => {
    onChange(option.name, option);
    setOpen(false);
  };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (shown.length ? (i + step + shown.length) % shown.length : 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault(); // choose the option, don't submit the form
      if (shown[active]) pick(shown[active]);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  }

  /** Leaving with text that is exactly one official name selects it; anything else stays unselected. */
  function onBlur() {
    setOpen(false);
    if (selected || !text.trim()) return;
    const key = searchKey(text);
    const exact = options.filter((o) => searchKey(o.name) === key);
    if (exact.length === 1) onChange(exact[0].name, exact[0]);
  }

  const invalid = !!error || (!selected && !!text.trim() && !open);
  const message = error ?? (invalid ? "יש לבחור ערך מהרשימה." : undefined);

  return (
    <div className="relative space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <Required />}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${id}-${shown[active].code}` : undefined}
          aria-invalid={invalid}
          aria-describedby={message ? `${id}-error` : undefined}
          required={required}
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value, null);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`${inputClass} pe-9 disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted ${invalid ? "ring-brand-600" : ""}`}
        />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted">
          {loading ? <Loader2 className="size-4 animate-spin" /> : selected ? <Check className="size-4 text-brand-600" /> : <ChevronDown className="size-4" />}
        </span>
      </div>
      {open && !disabled && !loading && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl bg-paper py-1 text-sm shadow-xl ring-1 ring-line"
        >
          {shown.length === 0 ? (
            <li className="px-3.5 py-2 text-muted">{emptyText}</li>
          ) : (
            shown.map((o, i) => (
              <li
                key={o.code}
                id={`${id}-${o.code}`}
                role="option"
                aria-selected={selected?.code === o.code}
                // mousedown, so the choice lands before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3.5 py-2 ${i === active ? "bg-brand-50" : ""} ${selected?.code === o.code ? "font-bold" : ""}`}
              >
                {o.name}
              </li>
            ))
          )}
        </ul>
      )}
      {message && <span id={`${id}-error`} role="alert" className="block text-xs text-brand-700">{message}</span>}
      {note && <span className="block text-xs text-brand-700">{note}</span>}
    </div>
  );
}
