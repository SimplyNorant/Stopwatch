import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import DarkModeToggle from "./darkModeToggle";

export default function ProfileButton({
  logout,
  userName,
}: {
  logout: Function;
  userName: string;
}) {
  return (
    <div className="fixed top-2 right-2">
      <Menu>
        <MenuButton className="outline-none">
          <img
            className="w-10"
            src="images/placeholder_avatar.png"
            alt="profile picture"
          />
        </MenuButton>

        <MenuItems
          modal={false}
          transition
          anchor="bottom end"
          className="w-50 rounded-xl outline-none bg-foreground p-1 text-sm/6 text-black transition duration-100 ease-out z-50"
        >
          <MenuItem>
            <button className="group flex w-full items-center rounded-lg px-3 py-1.5 data-focus:bg-gray-200">
              {userName}
            </button>
          </MenuItem>
          <MenuItem>
            <button className="group flex w-full items-center rounded-lg px-3 py-1.5 data-focus:bg-gray-200">
              Duplicate
            </button>
          </MenuItem>
          <div className="my-1 h-px bg-white/5" />
          <MenuItem>
            <button className="group flex w-full items-center rounded-lg px-3 py-1.5 data-focus:bg-gray-200">
              <DarkModeToggle />
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={logout}
              className="group flex w-full items-center rounded-lg px-3 py-1.5 data-focus:bg-gray-200"
            >
              Sign Out
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  );
}
