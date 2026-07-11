import Link from "next/link";
import styles from "./Nav.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/simulator", label: "Simulator" },
  { href: "/trends", label: "Trends" },
];

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Finance Tracker</span>
      <div className={styles.links}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
