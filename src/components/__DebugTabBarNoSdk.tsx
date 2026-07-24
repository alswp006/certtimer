import { useNavigate, useLocation } from "react-router-dom";
import type { TabItem } from "./FloatingTabBar";

export function DebugTabBarNoSdk({ items }: { items: TabItem[] }) {
  const navigate = useNavigate();
  const location = useLocation();
  console.log('DEBUG location (no sdk import):', JSON.stringify(location));
  return (
    <nav role="tablist" aria-label="메인 네비게이션">
      {items.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button key={item.path} type="button" role="tab" aria-selected={active} aria-label={item.label} onClick={() => navigate(item.path)}>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
