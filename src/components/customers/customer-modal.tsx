"use client";

import React, { useState, useEffect } from "react";
import { Customer, CustomerStatus } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    company: string;
    status: CustomerStatus;
    gstin?: string;
    address?: string;
  }) => void;
  initialData?: Customer | null;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CustomerModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("Active");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setCompany(initialData.company);
      setStatus(initialData.status);
      setGstin(initialData.gstin || "");
      setAddress(initialData.address || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setStatus("Active");
      setGstin("");
      setAddress("");
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim() || !email.includes("@")) newErrors.email = "Valid work email is required";
    if (!company.trim()) newErrors.company = "Company name is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      status,
      gstin: gstin.trim() || undefined,
      address: address.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Customer Profile" : "Add New Customer"}
      description={
        initialData
          ? "Update customer contact, tax identifier, and account status."
          : "Register a new client entity for subscription billing."
      }
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="gold" size="sm" onClick={handleSubmit} type="submit">
            {initialData ? "Save Changes" : "Create Customer"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            placeholder="e.g. Apex Global Tech"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            error={errors.company}
            required
          />
          <Input
            label="Primary Contact Person"
            placeholder="e.g. Arjun Verma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="billing@apextech.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="GSTIN Number (Optional)"
            placeholder="29AABCA1234F1Z8"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            helperText="Used for automated 18% GST tax breakdown"
          />
          <Select
            label="Account Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            options={[
              { value: "Active", label: "Active — Good Standing" },
              { value: "Inactive", label: "Inactive — No active billing" },
              { value: "Suspended", label: "Suspended — Invoicing Blocked" },
            ]}
          />
        </div>

        <Input
          label="Billing Address"
          placeholder="Building, Tech Park, City, PIN"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </form>
    </Modal>
  );
}

