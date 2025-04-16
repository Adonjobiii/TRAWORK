import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Toaster, toast } from 'react-hot-toast';
import { Users, CheckCircle2, AlertTriangle, XCircle, Plus, Trash2, LogOut } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'completed';
  deadline: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
}

function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', deadline: '' });
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchMembers();
      fetchTasks();
    }
  }, [session]);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from('members').select('*');
    if (error) {
      toast.error('Failed to fetch members');
    } else {
      setMembers(data);
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) {
      toast.error('Failed to fetch tasks');
    } else {
      setTasks(data);
    }
  };

  const projectStatus = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
    
    if (progress >= 80) return { status: 'On Track', color: 'text-green-500', icon: CheckCircle2 };
    if (progress >= 50) return { status: 'At Risk', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'Delayed', color: 'text-red-500', icon: XCircle };
  };

  const addMember = async () => {
    if (!newMember.name || !newMember.role) {
      toast.error('Please fill in all member details');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .insert([newMember])
        .select();

      if (error) throw error;
      
      setMembers([...members, ...(data as Member[])]);
      setNewMember({ name: '', role: '' });
      toast.success('Member added successfully!');
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.assignee || !newTask.deadline) {
      toast.error('Please fill in all task details');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...newTask, status: 'todo' }])
        .select();

      if (error) throw error;
      
      setTasks([...tasks, ...(data as Task[])]);
      setNewTask({ title: '', assignee: '', deadline: '' });
      toast.success('Task added successfully!');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      toast.success('Task status updated!');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(member => member.id !== memberId));
      toast.success('Member removed successfully!');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const getChartData = () => {
    const statusCounts = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };

    return {
      labels: ['To Do', 'In Progress', 'Completed'],
      datasets: [
        {
          data: [statusCounts.todo, statusCounts.in_progress, statusCounts.completed],
          backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        },
      ],
    };
  };

  const getMemberTasksData = () => {
    const memberTasks = members.map(member => ({
      name: member.name,
      tasks: tasks.filter(task => task.assignee === member.id).length,
    }));

    return {
      labels: memberTasks.map(m => m.name),
      datasets: [
        {
          label: 'Tasks Assigned',
          data: memberTasks.map(m => m.tasks),
          backgroundColor: '#6366F1',
        },
      ],
    };
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-8">
            <Users className="h-12 w-12 text-indigo-600" />
            <h1 className="ml-3 text-3xl font-bold text-gray-900">TRAWORK</h1>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-indigo-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">TRAWORK</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h2>
            <div className="h-64">
              <Pie data={getChartData()} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks per Member</h2>
            <div className="h-64">
              <Bar 
                data={getMemberTasksData()} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Team Members Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Team Members</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
                <select
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                >
                  <option value="">Select Role</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="Business Analyst">Business Analyst</option>
                </select>
                <button
                  onClick={addMember}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {members.map((member) => (
                  <div key={member.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => deleteMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Task title"
                  className="col-span-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <select
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                >
                  <option value="">Select Assignee</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
                <button
                  onClick={addTask}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <div key={task.id} className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-500">
                          Assigned to: {members.find(m => m.id === task.assignee)?.name} ({members.find(m => m.id === task.assignee)?.role})
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        className={`rounded-md border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          task.status === 'completed' ? 'bg-green-50 text-green-800' :
                          task.status === 'in_progress' ? 'bg-yellow-50 text-yellow-800' :
                          'bg-red-50 text-red-800'
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;