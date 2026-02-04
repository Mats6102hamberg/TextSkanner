"use client";

import React, { useState } from "react";
import MobileLayout from "@/components/MobileLayout";

interface MobileFormProps {
  title: string;
  onSubmit: (data: any) => void;
  children: React.ReactNode;
  submitText?: string;
  loading?: boolean;
  className?: string;
}

export default function MobileForm({
  title,
  onSubmit,
  children,
  submitText = "Submit",
  loading = false,
  className = ""
}: MobileFormProps) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <MobileLayout title={title} showBackButton>
      <div className={`p-4 ${className}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                value: (formData as any)[child.props.name] || "",
                onChange: (e: any) => handleInputChange(child.props.name, e.target.value),
                error: (errors as any)[child.props.name] || ""
              });
            }
            return child;
          })}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              submitText
            )}
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}

// Mobile Form Components
export function MobileInput({ 
  name, 
  label, 
  type = "text", 
  placeholder = "", 
  required = false,
  value = "",
  onChange,
  error = "",
  className = ""
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function MobileTextarea({ 
  name, 
  label, 
  placeholder = "", 
  required = false,
  rows = 4,
  value = "",
  onChange,
  error = "",
  className = ""
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function MobileSelect({ 
  name, 
  label, 
  options, 
  required = false,
  value = "",
  onChange,
  error = "",
  className = ""
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function MobileCheckbox({ 
  name, 
  label, 
  required = false,
  checked = false,
  onChange,
  error = "",
  className = ""
}: {
  name: string;
  label: string;
  required?: boolean;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          required={required}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={name} className="ml-2 text-sm text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
