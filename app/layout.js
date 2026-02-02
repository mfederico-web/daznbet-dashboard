import './globals.css'

export const metadata = {
  title: 'DAZN Bet - Weekly Trading Report',
  description: 'DAZN Bet Weekly Trading Report Dashboard - Italy',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
