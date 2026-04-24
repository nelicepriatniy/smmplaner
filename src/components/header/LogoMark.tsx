export function LogoMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- тот же SVG, что и фавикон (/logo.svg)
    <img
      src="/logo.svg"
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 object-contain"
    />
  );
}
