import React from "react";
import Link from "next/link";

const Header = () => (
  <>
    {/* Responsive Header */}
    <div className="responsive-header">
      <div className="mh-head first Sticky">
        <span className="mh-btns-left">
          <a className="" href="#menu"><i className="fa fa-align-justify"></i></a>
        </span>
        <span className="mh-text">
          <Link href="/newsfeed" title=""><img src="/images/logo2.png" alt="logo" /></Link>
        </span>
        <span className="mh-btns-right">
          <a className="fa fa-sliders" href="#shoppingbag"></a>
        </span>
      </div>
      <div className="mh-head second">
        <form className="mh-form">
          <input placeholder="search" />
          <a href="#/" className="fa fa-search"></a>
        </form>
      </div>
    </div>
    {/* Desktop Header */}
    <div className="topbar stick">
      <div className="logo">
        <Link href="/newsfeed" title="">
          <img src="/images/logo.png" alt="logo" />
        </Link>
      </div>
      <div className="top-area">
        <ul className="main-menu">
          <li>
            <a href="#" title="">Home</a>
            <ul>
              <li><Link href="/" title="">Home Social</Link></li>
              <li><a href="#" title="">Home Social 2</a></li>
              <li><a href="#" title="">Home Company</a></li>
              <li><Link href="/" title="">Login page</Link></li>
              <li><a href="#" title="">Logout Page</a></li>
              <li><Link href="/newsfeed" title="">news feed</Link></li>
            </ul>
          </li>
          <li>
            <a href="#" title="">timeline</a>
            <ul>
              <li><a href="#" title="">timeline</a></li>
              <li><a href="#" title="">timeline friends</a></li>
              <li><a href="#" title="">timeline groups</a></li>
              <li><a href="#" title="">timeline pages</a></li>
              <li><a href="#" title="">timeline photos</a></li>
              <li><a href="#" title="">timeline videos</a></li>
              <li><a href="#" title="">favourit page</a></li>
              <li><a href="#" title="">groups page</a></li>
              <li><a href="#" title="">Likes page</a></li>
              <li><a href="#" title="">people nearby</a></li>
            </ul>
          </li>
          <li>
            <a href="#" title="">account settings</a>
            <ul>
              <li><a href="#" title="">create fav page</a></li>
              <li><a href="#" title="">edit account setting</a></li>
              <li><a href="#" title="">edit-interest</a></li>
              <li><a href="#" title="">edit-password</a></li>
              <li><a href="#" title="">edit profile basics</a></li>
              <li><a href="#" title="">edit work educations</a></li>
              <li><a href="#" title="">message box</a></li>
              <li><a href="#" title="">Inbox</a></li>
              <li><a href="#" title="">notifications page</a></li>
            </ul>
          </li>
          <li>
            <a href="#" title="">more pages</a>
            <ul>
              <li><a href="#" title="">404 error page</a></li>
              <li><a href="#" title="">about</a></li>
              <li><a href="#" title="">contact</a></li>
              <li><a href="#" title="">faq&apos page</a></li>
              <li><a href="#" title="">insights</a></li>
              <li><a href="#" title="">knowledge base</a></li>
              <li><a href="#" title="">Widgts</a></li>
            </ul>
          </li>
        </ul>
        <ul className="setting-area">
          <li>
            <a href="#" title="Home" data-ripple=""><i className="ti-search"></i></a>
            <div className="searched">
              <form method="post" className="form-search">
                <input type="text" placeholder="Search Friend" />
                <button data-ripple=""><i className="ti-search"></i></button>
              </form>
            </div>
          </li>
          <li><Link href="/newsfeed" title="Home" data-ripple=""><i className="ti-home"></i></Link></li>
          <li>
            <a href="#" title="Notification" data-ripple="">
              <i className="ti-bell"></i><span>20</span>
            </a>
          </li>
          <li>
            <a href="#" title="Messages" data-ripple=""><i className="ti-comment"></i><span>12</span></a>
          </li>
          <li><a href="#" title="Languages" data-ripple=""><i className="fa fa-globe"></i></a></li>
        </ul>
        <div className="user-img">
          <img src="/images/resources/admin.jpg" alt="admin" />
          <span className="status f-online"></span>
        </div>
        <span className="ti-menu main-menu" data-ripple=""></span>
      </div>
    </div>
  </>
);

export default Header; 