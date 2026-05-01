import { useBillingCoachContext, useMetaContext, useTrainerContext } from '../../context/appContextStore'

export function Sidebar() {
  const { activeMenu, handleMenuClick } = useTrainerContext()
  const { activePlan } = useBillingCoachContext()
  const { navItems, studentCapacityText } = useMetaContext()

  return (
    <aside className="left-rail trainer-rail">
      <div className="brand-row">
        <img src="/if-brand-icon.png" alt="Insane Fit" className="brand-mark" />
      </div>

      <nav className="menu-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeMenu ? 'menu-item active' : 'menu-item'}
            onClick={() => handleMenuClick(item.id)}
          >
            <span className="menu-item-label">{item.label}</span>
            <span className="menu-item-hint">{item.hint}</span>
          </button>
        ))}
      </nav>

      <div className="rail-card">
        <p>Plano atual</p>
        <strong>{activePlan.name}</strong>
        <span>{studentCapacityText}</span>
      </div>
    </aside>
  )
}
