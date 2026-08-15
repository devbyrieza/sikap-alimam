/**
 * ⚠️ JANGAN DIHAPUS - FILE PENTING UNTUK BUILD PRODUKSI
 *
 * File ini adalah "Tailwind v4 Safelist" untuk memastikan semua utility class
 * yang dipakai di halaman (dashboard) ter-include dalam CSS bundle saat build
 * di server Linux (Coolify/Docker). 
 *
 * Root cause: Tailwind v4 menggunakan glob scanner yang menganggap `(` dan `)`
 * sebagai operator grup di Linux, sehingga folder `(dashboard)` terlewat.
 *
 * Solusi: File ini berada di luar route group, sehingga pasti di-scan,
 * dan menjamin semua class di bawah ini masuk ke dalam CSS bundle final.
 */

// Layout & Spacing
const _layout = [
  "w-full", "max-w-7xl", "mx-auto", "px-4", "px-5", "px-6", "py-6", "py-8",
  "p-4", "p-5", "p-6", "p-8", "pt-4", "pb-4", "pl-4", "pr-4",
  "sm:px-6", "lg:px-8", "sm:py-8", "sm:p-5", "sm:p-6", "sm:p-8",
  "mb-4", "mb-5", "mb-6", "mb-8", "mt-4", "mt-5", "mt-6", "mt-8",
  "ml-4", "mr-4", "gap-2", "gap-3", "gap-4", "gap-5", "gap-6",
  "sm:gap-4", "sm:gap-5", "sm:gap-6", "sm:mb-8",
  "space-y-4", "space-y-5", "space-y-6",
];

// Flexbox & Grid
const _flex = [
  "flex", "flex-1", "flex-col", "flex-row", "flex-wrap",
  "sm:flex-row", "lg:flex-row",
  "items-center", "items-start", "items-stretch",
  "justify-between", "justify-center", "justify-start", "justify-end",
  "grid", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4",
  "sm:grid-cols-2", "md:grid-cols-2", "md:grid-cols-3",
  "lg:grid-cols-3", "lg:grid-cols-4",
  "col-span-1", "col-span-2", "shrink-0",
];

// Colors & Backgrounds
const _colors = [
  "bg-white", "bg-slate-50", "bg-slate-100", "bg-slate-800", "bg-slate-900",
  "bg-indigo-50", "bg-indigo-100", "bg-indigo-600", "bg-indigo-700",
  "bg-indigo-800", "bg-indigo-900", "bg-indigo-950",
  "bg-emerald-50", "bg-emerald-100", "bg-emerald-600",
  "bg-amber-50", "bg-amber-100", "bg-amber-600",
  "bg-red-50", "bg-red-100", "bg-red-600",
  "bg-sky-50", "bg-sky-100", "bg-sky-600",
  "bg-violet-50", "bg-violet-100", "bg-violet-600",
  "bg-blue-50", "bg-blue-600",
  "bg-white/10", "bg-white/20", "bg-indigo-950/40",
];

// Gradients
const _gradients = [
  "bg-gradient-to-br", "bg-gradient-to-r", "bg-gradient-to-b",
  "from-indigo-600", "from-indigo-700", "from-indigo-800", "from-indigo-900",
  "via-indigo-800", "via-indigo-700",
  "to-indigo-700", "to-indigo-800", "to-indigo-900",
  "from-emerald-600", "to-emerald-700",
  "from-amber-500", "to-amber-600",
  "from-red-600", "to-red-700",
  "from-sky-500", "to-sky-600",
  "from-violet-600", "to-violet-700",
];

// Text Colors
const _text = [
  "text-white", "text-slate-400", "text-slate-500", "text-slate-600",
  "text-slate-700", "text-slate-800", "text-slate-900",
  "text-indigo-50", "text-indigo-100", "text-indigo-200", "text-indigo-300",
  "text-indigo-600", "text-indigo-700",
  "text-emerald-600", "text-emerald-700",
  "text-amber-600", "text-amber-700",
  "text-red-600", "text-red-700",
  "text-sky-600", "text-sky-700",
  "text-violet-600", "text-violet-700",
  "text-blue-800", "text-blue-900",
];

// Typography
const _typography = [
  "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl",
  "sm:text-sm", "sm:text-base", "sm:text-lg", "sm:text-2xl",
  "text-[11px]", "text-[13px]",
  "font-medium", "font-semibold", "font-bold", "font-black",
  "tracking-tight", "tracking-wider",
  "leading-relaxed", "leading-snug",
  "truncate", "line-clamp-1", "line-clamp-2",
  "whitespace-nowrap", "break-words",
  "text-center", "text-left", "text-right",
  "uppercase",
];

// Borders & Radius
const _borders = [
  "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-full",
  "border", "border-2", "border-4",
  "border-slate-100", "border-slate-200", "border-slate-300",
  "border-indigo-100", "border-indigo-200", "border-indigo-300", "border-indigo-500",
  "border-emerald-200", "border-amber-200", "border-red-200",
  "border-sky-200", "border-violet-200", "border-blue-200",
  "border-white/10", "border-white/20", "border-dashed",
  "divide-y", "divide-slate-100", "divide-slate-200",
];

// Shadows
const _shadows = [
  "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl",
  "shadow-[0_4px_20px_rgb(0,0,0,0.04)]",
  "shadow-[0_8px_30px_rgb(49,46,129,0.3)]",
  "hover:shadow-md", "hover:shadow-lg",
];

// Sizing
const _sizing = [
  "w-3", "w-4", "w-5", "w-6", "w-7", "w-8", "w-10", "w-12",
  "h-3", "h-4", "h-5", "h-6", "h-7", "h-8", "h-10", "h-12",
  "w-full", "h-full", "min-h-screen", "min-w-0",
  "w-fit", "h-fit",
  "sm:w-8", "sm:h-8",
  "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-3xl",
  "min-w-[600px]", "min-w-[800px]", "min-w-[1000px]",
];

// Opacity & Effects
const _effects = [
  "opacity-50", "opacity-75", "opacity-100",
  "backdrop-blur-md", "backdrop-blur-sm",
  "overflow-hidden", "overflow-x-auto", "overflow-y-auto",
  "relative", "absolute", "z-10", "inset-0",
  "-top-10", "-right-10", "-bottom-10",
  "blur-2xl", "blur-3xl",
];

// Transitions & Animations
const _transitions = [
  "transition-all", "transition-colors", "transition-shadow",
  "duration-200", "duration-300",
  "hover:border-indigo-300", "hover:border-emerald-300",
  "hover:border-violet-300", "hover:border-sky-300",
  "hover:bg-slate-50", "hover:bg-slate-100",
  "hover:bg-indigo-50", "hover:bg-emerald-50",
  "hover:from-indigo-700", "hover:to-indigo-800",
  "group", "group-hover:bg-indigo-50", "group-hover:bg-emerald-50",
  "group-hover:bg-violet-50", "group-hover:bg-sky-50",
  "focus:outline-none", "focus:ring-2", "focus:ring-4",
  "focus:ring-indigo-100", "focus:border-indigo-400",
  "animate-spin",
];

// Table specific
const _table = [
  "table", "w-full", "text-left", "text-sm",
  "thead", "tbody", "tr", "th", "td",
  "px-5", "py-4",
  "hover:bg-slate-50/50",
];

// Responsive helpers
const _responsive = [
  "hidden", "block", "sm:block", "sm:hidden", "lg:hidden", "sm:flex",
  "lg:flex", "sm:grid", "sm:grid-cols-2",
  "sm:w-8", "sm:h-8", "sm:p-3.5",
];

export default {};
