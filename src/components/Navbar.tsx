import ThemeToggler from "./ThemeToggler";
import { SidebarTrigger } from "./ui/sidebar";
import { Ephesis } from "next/font/google";

const genesis = Ephesis({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const Navbar = () => {
  return (
    <div className="bg-background   h-[70px] mt-1  px-5 flex justify-between w-full items-center border-b border-border min-h-[100px]">
      <SidebarTrigger />
      <div className="flex items-center flex-col">
        <h1 className={`${genesis.className} text-6xl font-bold`}><a href="/">Canbri</a></h1>
        <span className="-mt-3 pl-[80px] font-light">Interiors</span>
      </div>
      <div className="flex items-center">
        <ThemeToggler />
      </div>
    </div>
  );
};

export default Navbar;
