import '../styles/globals.css'
import '../styles/main.min.css'
import '../styles/style.css'
import '../styles/color.css'
import '../styles/responsive.css'
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/themify-icons@0.1.2/css/themify-icons.css" />
      </head>
      <body>
        <NProgressLoader />
        <div>
          {children}
        </div>
      </body>
    </html>
  )
}