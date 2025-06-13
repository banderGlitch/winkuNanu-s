'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="container-fluid pdng0 login-page">
      <div className="row merged">
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
          <div className="land-featurearea">
            <div className="land-meta">
              <h1>Winku</h1>
              <p>
                Winku is free to use for as long as you want with two active projects.
              </p>
              <div className="friend-logo">
                <span><Image src="/images/wink.png" width={100} height={100} alt="" /></span>
              </div>
              <a href="#" title="" className="folow-me">Follow Us on</a>
            </div>
          </div>
        </div>
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
          <div className="login-reg-bg">
            {isLogin ? (
              <div className="log-reg-area sign">
                <h2 className="log-title">Login</h2>
                <p>
                  Don&apos;t use Winku Yet? <a href="#" title="">Take the tour</a> or <a href="#" title="">Join now</a>
                </p>
                <form method="post">
                  <div className="form-group">
                    <input type="text" id="input" required="required" />
                    <label className="control-label" htmlFor="input">Username</label>
                    <i className="mtrl-select"></i>
                  </div>
                  <div className="form-group">
                    <input type="password" required="required" />
                    <label className="control-label" htmlFor="input">Password</label>
                    <i className="mtrl-select"></i>
                  </div>
                  <div className="checkbox">
                    <label>
                      <input type="checkbox" defaultChecked />
                      <i className="check-box"></i>Always Remember Me.
                    </label>
                  </div>
                  <a href="#" title="" className="forgot-pwd">Forgot Password?</a>
                  <div className="submit-btns">
                    <button className="mtr-btn signin" type="button"><span>Login</span></button>
                    <button className="mtr-btn signup" type="button" onClick={() => setIsLogin(false)}>
                      <span>Register</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="log-reg-area reg">
                <h2 className="log-title">Register</h2>
                <p>
                Don&apos;t use Winku Yet? <a href="#" title="">Take the tour</a> or <a href="#" title="">Join now</a>
                </p>
                <form method="post">
                  <div className="form-group">
                    <input type="text" required="required" />
                    <label className="control-label" htmlFor="input">First & Last Name</label>
                    <i className="mtrl-select"></i>
                  </div>
                  <div className="form-group">
                    <input type="text" required="required" />
                    <label className="control-label" htmlFor="input">User Name</label>
                    <i className="mtrl-select"></i>
                  </div>
                  <div className="form-group">
                    <input type="password" required="required" />
                    <label className="control-label" htmlFor="input">Password</label>
                    <i className="mtrl-select"></i>
                  </div>
                  <div className="form-radio">
                    <div className="radio">
                      <label>
                        <input type="radio" name="radio" defaultChecked />
                        <i className="check-box"></i>Male
                      </label>
                    </div>
                    <div className="radio">
                      <label>
                        <input type="radio" name="radio" />
                        <i className="check-box"></i>Female
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <input type="text" required="required" />
                    <label className="control-label" htmlFor="input">Email</label>
                    <i className="mtrl-select"></i>
                  </div>
                  <div className="checkbox">
                    <label>
                      <input type="checkbox" defaultChecked />
                      <i className="check-box"></i>Accept Terms & Conditions ?
                    </label>
                  </div>
                  <a href="#" title="" className="already-have" onClick={() => setIsLogin(true)}>
                    Already have an account
                  </a>
                  <div className="submit-btns">
                    <button className="mtr-btn signup" type="button"><span>Register</span></button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}