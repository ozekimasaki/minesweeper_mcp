/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Windows 95 クラシックカラーパレット
        win95: {
          bg: '#c0c0c0',           // 標準背景色
          'bg-dark': '#808080',    // 暗い背景
          'bg-light': '#dfdfdf',   // 明るい背景
          border: {
            light: '#ffffff',      // ハイライト（上・左）
            dark: '#808080',       // シャドウ（下・右）
            darker: '#404040',     // より暗いシャドウ
          },
          titlebar: {
            active: '#000080',     // アクティブタイトルバー
            inactive: '#808080',   // 非アクティブタイトルバー
          },
          button: {
            face: '#c0c0c0',       // ボタン表面
            highlight: '#ffffff',  // ボタンハイライト
            shadow: '#808080',     // ボタンシャドウ
            darkShadow: '#404040', // ボタン暗いシャドウ
          },
          // LED/デジタル表示用
          led: {
            bg: '#300000',         // LEDバックグラウンド
            on: '#ff0000',         // LED点灯
            off: '#400000',        // LED消灯
          },
          // セル状態別カラー
          cell: {
            hidden: '#c0c0c0',     // 未開封セル
            revealed: '#bdbdbd',   // 開封済みセル
            mine: '#ff0000',       // 地雷（爆発）
            flag: '#c0c0c0',       // フラグ付きセル
          },
          // 数字カラー（クラシックマインスイーパー準拠）
          number: {
            1: '#0000ff',          // 青
            2: '#008000',          // 緑
            3: '#ff0000',          // 赤
            4: '#000080',          // 紺
            5: '#800000',          // 茶
            6: '#008080',          // ティール
            7: '#000000',          // 黒
            8: '#808080',          // グレー
          },
        },
      },
      boxShadow: {
        // Windows 95 スタイルの凸型シャドウ（ボタン用）
        'win95-raised': 'inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf',
        // Windows 95 スタイルの凹型シャドウ（押されたボタン/入力欄用）
        'win95-inset': 'inset -1px -1px #ffffff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080',
        // ウィンドウ外枠
        'win95-window': 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #ffffff',
        // ステータスバー/インセット領域
        'win95-status': 'inset -1px -1px #dfdfdf, inset 1px 1px #808080',
        // セルが押された時
        'win95-pressed': 'inset 1px 1px #808080',
      },
      fontFamily: {
        // レトロなビットマップ風フォント
        'win95': ['"MS Sans Serif"', '"Segoe UI"', 'Tahoma', 'sans-serif'],
        'digital': ['"Digital-7"', '"Segment7"', '"Courier New"', 'monospace'],
      },
      animation: {
        'cell-reveal': 'cellReveal 0.15s ease-out',
        'cell-press': 'cellPress 0.1s ease-out',
        'flag-plant': 'flagPlant 0.2s ease-out',
        'mine-explode': 'mineExplode 0.3s ease-out',
        'confetti': 'confetti 1s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        cellReveal: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cellPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        flagPlant: {
          '0%': { transform: 'scale(0) rotate(-45deg)' },
          '50%': { transform: 'scale(1.2) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        mineExplode: {
          '0%': { transform: 'scale(1)', backgroundColor: '#ff0000' },
          '50%': { transform: 'scale(1.3)', backgroundColor: '#ffff00' },
          '100%': { transform: 'scale(1)', backgroundColor: '#ff0000' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 0, 0, 0.5)' },
          '50%': { boxShadow: '0 0 15px rgba(255, 0, 0, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
