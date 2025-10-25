// src/context/WorkspaceContext.jsx
import { createContext, useContext } from "react";

export const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);
