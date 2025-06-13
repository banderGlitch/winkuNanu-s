import '../styles/globals.css'
import NProgressLoader from './components/NProgressLoader'

export const metadata = {
  title: 'Winku Social Network',
  description: 'A modern social network platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/fav.png" type="image/png" sizes="16x16" />
      </head>
      <body>
        <NProgressLoader />
        <div className="login-page">
          <div className="theme-layout">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}