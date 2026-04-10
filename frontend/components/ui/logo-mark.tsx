import Image from "next/image";

export function LogoMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-plum bg-white shadow-sm">
      <Image src="/assets/logo.svg" alt="LE_LA" width={24} height={34} />
    </div>
  );
}
