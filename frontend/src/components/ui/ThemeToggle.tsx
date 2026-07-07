import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded p-2 text-on-surface-variant hover:bg-surface-container"
    >
      {theme === 'dark' ? (
        <FiSun className="size-5" />
      ) : (
        <FiMoon className="size-5" />
      )}
    </button>
  )
}
