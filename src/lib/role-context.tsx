"use client";
import { createContext, useContext } from "react";
import type { Role } from "@/types";

export const RoleContext = createContext<{
  role: Role;
  setRole: (r: Role) => void;
}>({ role: "Donor", setRole: () => {} });

export function useRole() {
  return useContext(RoleContext);
}
