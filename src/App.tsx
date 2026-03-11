import { useEffect, useState } from "react";
import "./styles.css";
import type { Task } from "./types/task";

declare global {
  interface Window {
    electronAPI: {
      getTasks: () => any;
      saveTasks: (tasks: any) => void;
      notify: (task: any) => void;
      onPlaySound: (callback: (event: any, file: string) => void) => void;
    };
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nombre, setNombre] = useState("");
  const [hora, setHora] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [view, setView] = useState<"tasks" | "create">("tasks");

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (task: Task) => {
    if (Notification.permission === "granted") {
      new Notification("⏰ Tarea pendiente", {
        body: `${task.hora} - ${task.nombre}`,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const currentHour = now.getHours().toString().padStart(2, "0");
      const currentMinute = now.getMinutes().toString().padStart(2, "0");

      const updatedTasks = tasks.map((task) => {
        const [taskHour, taskMinute] = task.hora.split(":");

        if (
          taskHour === currentHour &&
          taskMinute === currentMinute &&
          !task.completed &&
          !task.notified
        ) {
          // showNotification(task);

          if (window.electronAPI?.notify) {
            window.electronAPI.notify(task);
          } else {
            showNotification(task);
          }

          return {
            ...task,
            notified: true,
          };
        }

        return task;
      });

      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    }, 1000); // revisar cada segundo

    return () => clearInterval(interval);
  }, [tasks]);

  const saveTasks = (tasks: Task[]) => {
    if (window.electronAPI) {
      window.electronAPI.saveTasks(tasks);
    } else {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  };

  // cargar tareas
  useEffect(() => {
    const load = async () => {
      let saved: Task[] = [];

      if (window.electronAPI) {
        try {
          saved = await window.electronAPI.getTasks();
        } catch (err) {
          console.error(err);
          saved = [];
        }
      } else {
        saved = JSON.parse(localStorage.getItem("tasks") || "[]");
      }

      const updated = saved.map((task) => {
        if (task.fecha !== today) {
          return { ...task, completed: false, fecha: today, notified: false };
        }
        return task;
      });

      setTasks(updated);
      saveTasks(updated);
    };

    load();
  }, []);

  // agregar tarea
  const addTask = () => {
    if (!nombre.trim() || !hora) {
      alert("Debes ingresar una hora y un nombre de tarea");
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      nombre,
      hora,
      completed: false,
      fecha: today,
      notified: false,
    };

    const updated = [...tasks, newTask].sort((a, b) =>
      a.hora.localeCompare(b.hora),
    );

    setTasks(updated);
    saveTasks(updated);

    setNombre("");
    setHora("");
  };

  // toggle tarea
  const toggleTask = (id: number) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );

    setTasks(updated);
    saveTasks(updated);
  };

  // eliminar
  const deleteTask = (id: number) => {
    const updated = tasks.filter((t) => t.id !== id);

    setTasks(updated);
    saveTasks(updated);
  };

  useEffect(() => {
    if (window.electronAPI?.onPlaySound) {
      window.electronAPI.onPlaySound((event, file: string) => {
        console.log("Reproduciendo sonido:", file);
        const normalizedPath = file.replace(/\\/g, "/");
        const audio = new Audio(`file://${normalizedPath}`);
        audio.play().catch((err) => console.error(err));
      });
    }
  }, []);

  return (
    <div className="daily">
      <div className="menu">
        <button onClick={() => setView("tasks")}>📋 Ver tareas</button>
        <button onClick={() => setView("create")}>➕ Nueva tarea</button>
      </div>
      <div className="widget">
        <h2>📅 Tareas del día</h2>

        {view === "create" && (
          <div className="form">
            <input
              type="text"
              placeholder="Nombre tarea"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <div className="box">
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />

              <button onClick={addTask}>Agregar</button>
            </div>
          </div>
        )}

        {view === "tasks" && (
          <div className="tasks">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task ${task.completed ? "done" : ""}`}
              >
                <span className="hora">{task.hora}</span>

                <span className="nombre">{task.nombre}</span>

                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />

                <button onClick={() => deleteTask(task.id)}>❌</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
