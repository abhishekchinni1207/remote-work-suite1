import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";


export default function TaskBoard({ workspaceId }) {
  const [lists, setLists] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");

  // Fetch all lists + tasks
  useEffect(() => {
    fetchLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function fetchLists() {
    const { data, error } = await supabase
      .from("lists")
      .select("id, title, position, tasks(id, title, description, position)")
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true })
      .order("position", { referencedTable: "tasks", ascending: true });

    if (error) console.error("Error fetching lists:", error);
    else setLists(data);
  }

  // Create new list
  async function addList() {
    if (!newListTitle.trim()) return;
    const { data, error } = await supabase
      .from("lists")
      .insert([{ workspace_id: workspaceId, title: newListTitle }])
      .select();

    if (error) console.error("Error adding list:", error);
    else setLists([...lists, { ...data[0], tasks: [] }]);

    setNewListTitle("");
  }

  // Add task to a list
  async function addTask(listId) {
    const title = prompt("Enter task title:");
    if (!title) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert([{ list_id: listId, title }])
      .select();

    if (error) console.error("Error adding task:", error);
    else {
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, tasks: [...(list.tasks || []), data[0]] }
            : list
        )
      );
    }
  }

  // Edit task title
  async function editTask(task) {
    const title = prompt("Edit task title:", task.title);
    if (!title) return;

    const { error } = await supabase
      .from("tasks")
      .update({ title })
      .eq("id", task.id);

    if (error) console.error("Error editing task:", error);
    else {
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          tasks: list.tasks.map((t) =>
            t.id === task.id ? { ...t, title } : t
          ),
        }))
      );
    }
  }

  // Delete task
  async function deleteTask(taskId, listId) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error("Error deleting task:", error);
    else {
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, tasks: list.tasks.filter((t) => t.id !== taskId) }
            : list
        )
      );
    }
  }

  return (
    <div className="flex gap-6 overflow-x-auto p-4">
      {lists.map((list) => (
        <div
          key={list.id}
          className="bg-white shadow rounded-2xl w-72 flex-shrink-0 p-4"
        >
          <h3 className="font-semibold text-lg mb-3">{list.title}</h3>

          <div className="space-y-2">
            {list.tasks?.map((task) => (
              <div
                key={task.id}
                className="bg-gray-100 rounded-lg p-2 flex justify-between items-center"
              >
                <span>{task.title}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => editTask(task)}
                    className="text-sm text-blue-500"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteTask(task.id, list.id)}
                    className="text-sm text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addTask(list.id)}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200"
          >
            Add Task
          </button>
        </div>
      ))}

      {/* New List Creator */}
      <div className="bg-gray-100 w-72 p-4 rounded-2xl flex-shrink-0 flex flex-col justify-center items-center">
        <input
          type="text"
          placeholder="New list title..."
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
          className="mb-3 w-full p-2 rounded border border-gray-300"
        />
        <button
          onClick={addList}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700"
        >
          + Add List
        </button>
      </div>
    </div>
  );
}
