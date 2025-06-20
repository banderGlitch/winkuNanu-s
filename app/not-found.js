'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="theme-layout">
      <div className="container-fluid pdng0">
        <div className="row">
          <div className="col-lg-12">
            <div className="error-page">
              <div className="bg-image">
                <Image
                  src="/images/resources/404.jpg"
                  alt="404 Background"
                  fill
                  style={{
                    objectFit: 'cover',
                    zIndex: -1,
                  }}
                  priority
                />
              </div>
              <div className="error-meta">
                <h1>whoops!</h1>
                <span>we couldn&apos;t find that page </span>
                <Link 
                  href="/" 
                  className="ripple-btn"
                  data-ripple=""
                >
                  Go Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 