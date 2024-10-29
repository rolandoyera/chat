import Image from "next/image";
import Link from "next/link";
import logoDark from "/img/logo-white.png";
import logoLight from "/img/fahl-logo-black-jpg.jpg";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggler from "./ThemeToggler";
import { SidebarTrigger } from "./ui/sidebar";

const Navbar = () => {
  return (
    <div className="bg-background   h-[70px] mt-3  px-5 flex justify-between w-full items-center border-b border-border">
      <SidebarTrigger />
      <Link href="/">
        {/* Light mode logo */}
        <Image
          priority
          src={logoLight}
          alt="Fine Art Handcrafted Lighting"
          width={150}
          className="block dark:hidden " // Show only in light mode
        />
        {/* Dark mode logo */}
        <Image
          priority
          src={logoDark}
          alt="Fine Art Handcrafted Lighting"
          width={150}
          className="hidden dark:block" // Show only in dark mode
        />
      </Link>
      <div className="flex items-center">
        <ThemeToggler />
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback className="text-black">BT</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/auth">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
