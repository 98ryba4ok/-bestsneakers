import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import "./SearchBox.css";

export default function SearchBox({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchSneakers = useCallback(
    debounce(async (search: string) => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/api/sneakers/?search=${search}`);
        const data = await res.json();
        setResults(data.results || data);
      } catch (e) {
        console.error("Ошибка при поиске:", e);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSneakers(query);
  }, [query, fetchSneakers]);

  const handleSelect = (id: number) => {
    navigate(`/sneakers/${id}`);
    setQuery("");
    onClose();
  };

  // Закрытие по клику вне модалки
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Закрытие по ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="search-modal">
      <div className="search-box" ref={modalRef}>
        <button className="search-close" onClick={onClose}>
          &times;
        </button>
        <input
          type="text"
          placeholder="Введите название кроссовок..."
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <ul className="search-dropdown">
            {results.map((sneaker) => (
              <li key={sneaker.id} onClick={() => handleSelect(sneaker.id)}>
                {sneaker.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
