import React from 'react';
import './BlobCharacters.css';

export default function BlobCharacters({ isPasswordFocused, emailLength = 0, isShowPassword = false, hasError = false }) {
  // Eye tracking offset based on email length (-8px to +8px)
  const eyeX = Math.min(Math.max((emailLength - 8) * 0.7, -8), 8);

  // Determine current mode (error laughing mode takes priority)
  let mode = 'email';
  if (hasError) {
    mode = 'error';
  } else if (isPasswordFocused) {
    mode = isShowPassword ? 'revealed' : 'password';
  }

  return (
    <div className="blob-stage">
      <div className={`blob-group mode-${mode}`}>
        
        {/* 1. Purple Tall Blob (Back Left) */}
        <div className="blob blob-purple">
          <div
            className="blob-face"
            style={{ transform: mode === 'email' ? `translateX(${eyeX}px)` : 'none' }}
          >
            {mode === 'email' && (
              <>
                <div className="eyes-happy">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-smile"></div>
              </>
            )}
            {mode === 'password' && (
              <>
                <div className="eyes-sad">
                  <span className="sad-arch"></span>
                  <span className="sad-arch"></span>
                </div>
                <div className="mouth-frown"></div>
              </>
            )}
            {mode === 'revealed' && (
              <>
                <div className="eyes-shocked">
                  <span className="angry-brow left-brow"></span>
                  <span className="angry-brow right-brow"></span>
                </div>
                <div className="mouth-open-shock"></div>
              </>
            )}
            {mode === 'error' && (
              <>
                <div className="eyes-happy">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-laugh"></div>
              </>
            )}
          </div>
        </div>

        {/* 2. Black Pill Blob (Middle) */}
        <div className="blob blob-black">
          <div
            className="blob-face"
            style={{ transform: mode === 'email' ? `translateX(${eyeX}px)` : 'none' }}
          >
            {mode === 'email' && (
              <>
                <div className="eyes-dots white-eyes">
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="mouth-smile white-mouth"></div>
              </>
            )}
            {mode === 'password' && (
              <>
                <div className="eyes-lines white-eyes">
                  <span className="line"></span>
                  <span className="line"></span>
                </div>
                <div className="mouth-frown white-mouth"></div>
              </>
            )}
            {mode === 'revealed' && (
              <>
                <div className="eyes-shocked white-eyes">
                  <span className="angry-brow left-brow"></span>
                  <span className="angry-brow right-brow"></span>
                </div>
                <div className="mouth-frown white-mouth"></div>
              </>
            )}
            {mode === 'error' && (
              <>
                <div className="eyes-happy white-eyes">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-laugh white-laugh"></div>
              </>
            )}
          </div>
        </div>

        {/* 3. Yellow Blob (Right) */}
        <div className="blob blob-yellow">
          <div
            className="blob-face"
            style={{ transform: mode === 'email' ? `translateX(${eyeX}px)` : 'none' }}
          >
            {mode === 'email' && (
              <>
                <div className="eyes-happy">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-smile"></div>
              </>
            )}
            {mode === 'password' && (
              <>
                <div className="eyes-sad">
                  <span className="sad-arch"></span>
                  <span className="sad-arch"></span>
                </div>
                <div className="mouth-frown"></div>
              </>
            )}
            {mode === 'revealed' && (
              <>
                <div className="eyes-shocked">
                  <span className="angry-brow left-brow"></span>
                  <span className="angry-brow right-brow"></span>
                </div>
                <div className="mouth-frown"></div>
              </>
            )}
            {mode === 'error' && (
              <>
                <div className="eyes-happy">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-laugh"></div>
              </>
            )}
          </div>
        </div>

        {/* 4. Orange Semi-Circle Blob (Front Center) */}
        <div className="blob blob-orange">
          <div
            className="blob-face"
            style={{ transform: mode === 'email' ? `translateX(${eyeX}px)` : 'none' }}
          >
            {mode === 'email' && (
              <>
                <div className="eyes-happy">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-smile"></div>
              </>
            )}
            {mode === 'password' && (
              <>
                <div className="eyes-sad">
                  <span className="sad-arch"></span>
                  <span className="sad-arch"></span>
                </div>
                <div className="mouth-frown"></div>
              </>
            )}
            {mode === 'revealed' && (
              <>
                <div className="eyes-shocked">
                  <span className="angry-brow left-brow"></span>
                  <span className="angry-brow right-brow"></span>
                </div>
                <div className="mouth-open-shock"></div>
              </>
            )}
            {mode === 'error' && (
              <>
                <div className="eyes-happy">
                  <span className="arch-eye"></span>
                  <span className="arch-eye"></span>
                </div>
                <div className="mouth-laugh"></div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
