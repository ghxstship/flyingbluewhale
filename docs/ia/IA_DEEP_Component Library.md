# Deep Site Map & Workflow Inventory: Component Library

> *Generated via complete 5-level AST tracing*

```text
Component Library
└── LocationPicker Component (`Component`)
    ├── Identity: { Name: "LocationPicker Component", Level: "Component", Parent: "Component Library", Path: "//components/LocationPicker" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── select Section (`Section`)
        ├── Identity: { Name: "select Section", Level: "Section" }
        └── select (`Element`)
            ├── Identity: { Name: "select", Level: "Element" }
            └── onChange (`Micro-Interaction`)
                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: (e) => onChange?.(e.target.value || null)"
            └── option (`Element`)
                ├── Identity: { Name: "option", Level: "Element" }
            └── optgroup (`Element`)
                ├── Identity: { Name: "optgroup", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }

└── ExpenseApprovalActions Component (`Component`)
    ├── Identity: { Name: "ExpenseApprovalActions Component", Level: "Component", Parent: "Component Library", Path: "//components/console/expenses/ExpenseApprovalActions" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => handleAction('approve')"
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => handleAction('reject')"

└── ExpenseForm Component (`Component`)
    ├── Identity: { Name: "ExpenseForm Component", Level: "Component", Parent: "Component Library", Path: "//components/console/expenses/ExpenseForm" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Check (`Component`)
                    ├── Identity: { Name: "Check", Level: "Component" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── button (`Element`)
                    ├── Identity: { Name: "button", Level: "Element" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => {
              setSubmitted(false);
       ..."
                └── button (`Element`)
                    ├── Identity: { Name: "button", Level: "Element" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => router.push('/app/expenses')"
    └── form Section (`Section`)
        ├── Identity: { Name: "form Section", Level: "Section" }
        └── form (`Element`)
            ├── Identity: { Name: "form", Level: "Element" }
            └── onSubmit (`Micro-Interaction`)
                ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleSubmit"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setCategory(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setAmount(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDescription(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setProposalId(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── input (`Element`)
                        ├── Identity: { Name: "input", Level: "Element" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setIsBillable(e.target.checked)"
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── ReceiptUploader (`Component`)
                        ├── Identity: { Name: "ReceiptUploader", Level: "Component" }
                        └── onUploadComplete (`Micro-Interaction`)
                            ├── Identity: { Name: "onUploadComplete", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (url, name) => setReceipts(prev => [...prev, { url..."
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── button (`Element`)
                    ├── Identity: { Name: "button", Level: "Element" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => router.push('/app/expenses')"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }

└── ExpensesTable Component (`Component`)
    ├── Identity: { Name: "ExpensesTable Component", Level: "Component", Parent: "Component Library", Path: "//components/console/expenses/ExpensesTable" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── ViewBar (`Component`)
                    ├── Identity: { Name: "ViewBar", Level: "Component" }
                    └── onSelectView (`Micro-Interaction`)
                        ├── Identity: { Name: "onSelectView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: setActiveViewId"
                    └── onCreateView (`Micro-Interaction`)
                        ├── Identity: { Name: "onCreateView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (opts) => createView({
              name: opts.na..."
                    └── onDeleteView (`Micro-Interaction`)
                        ├── Identity: { Name: "onDeleteView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: deleteView"
                    └── onDuplicateView (`Micro-Interaction`)
                        ├── Identity: { Name: "onDuplicateView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: duplicateView"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SearchInput (`Component`)
                        ├── Identity: { Name: "SearchInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: setSearch"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setShowColumnConfig(true)"
                        └── SlidersHorizontal (`Component`)
                            ├── Identity: { Name: "SlidersHorizontal", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setShowImport(true)"
                        └── Upload (`Component`)
                            ├── Identity: { Name: "Upload", Level: "Component" }
                    └── DataExportMenu (`Component`)
                        ├── Identity: { Name: "DataExportMenu", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FilterPills (`Component`)
                    ├── Identity: { Name: "FilterPills", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: setStatusFilter"
    └── BulkActionBar Section (`Section`)
        ├── Identity: { Name: "BulkActionBar Section", Level: "Section" }
        └── BulkActionBar (`Component`)
            ├── Identity: { Name: "BulkActionBar", Level: "Component" }
            └── onDeselectAll (`Micro-Interaction`)
                ├── Identity: { Name: "onDeselectAll", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: deselectAll"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── Checkbox (`Component`)
                                    ├── Identity: { Name: "Checkbox", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: toggleAll"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Checkbox (`Component`)
                                    ├── Identity: { Name: "Checkbox", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: () => toggle(exp.id)"
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── RowActionMenu (`Component`)
                                    ├── Identity: { Name: "RowActionMenu", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
    └── DataImportDialog Section (`Section`)
        ├── Identity: { Name: "DataImportDialog Section", Level: "Section" }
        └── DataImportDialog (`Component`)
            ├── Identity: { Name: "DataImportDialog", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowImport(false)"
            └── onComplete (`Micro-Interaction`)
                ├── Identity: { Name: "onComplete", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => router.refresh()"
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => handleReimburse(reimburseId)"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setReimburseId(null)"
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => handleDeleteExpense(deleteId)"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setDeleteId(null)"
    └── ColumnConfigPanel Section (`Section`)
        ├── Identity: { Name: "ColumnConfigPanel Section", Level: "Section" }
        └── ColumnConfigPanel (`Component`)
            ├── Identity: { Name: "ColumnConfigPanel", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowColumnConfig(false)"
            └── onColumnsChange (`Micro-Interaction`)
                ├── Identity: { Name: "onColumnsChange", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: setColumns"
            └── onRowHeightChange (`Micro-Interaction`)
                ├── Identity: { Name: "onRowHeightChange", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: setRowHeight"

└── MileageForm Component (`Component`)
    ├── Identity: { Name: "MileageForm Component", Level: "Component", Parent: "Component Library", Path: "//components/console/expenses/MileageForm" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Check (`Component`)
                    ├── Identity: { Name: "Check", Level: "Component" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => {
              setSubmitted(false);
       ..."
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => router.push('/app/expenses/mileage')"
    └── form Section (`Section`)
        ├── Identity: { Name: "form Section", Level: "Section" }
        └── form (`Element`)
            ├── Identity: { Name: "form", Level: "Element" }
            └── onSubmit (`Micro-Interaction`)
                ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleSubmit"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setOrigin(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDestination(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDistance(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setNotes(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setProposalId(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── input (`Element`)
                        ├── Identity: { Name: "input", Level: "Element" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setIsBillable(e.target.checked)"
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => router.push('/app/expenses/mileage')"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }

└── ReceiptUploader Component (`Component`)
    ├── Identity: { Name: "ReceiptUploader Component", Level: "Component", Parent: "Component Library", Path: "//components/console/expenses/ReceiptUploader" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── onDragOver (`Micro-Interaction`)
                    ├── Identity: { Name: "onDragOver", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleDragOver"
                └── onDragLeave (`Micro-Interaction`)
                    ├── Identity: { Name: "onDragLeave", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleDragLeave"
                └── onDrop (`Micro-Interaction`)
                    ├── Identity: { Name: "onDrop", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleDrop"
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => fileInputRef.current?.click()"
                └── onKeyDown (`Micro-Interaction`)
                    ├── Identity: { Name: "onKeyDown", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: (e) => e.key === 'Enter' && fileInputRef.current?...."
                └── Upload (`Component`)
                    ├── Identity: { Name: "Upload", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── input (`Element`)
                    ├── Identity: { Name: "input", Level: "Element" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => e.target.files && handleFiles(e.target.file..."
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Image (`Component`)
                        ├── Identity: { Name: "Image", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── File (`Component`)
                            ├── Identity: { Name: "File", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── ImageIcon (`Component`)
                            ├── Identity: { Name: "ImageIcon", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── Check (`Component`)
                            ├── Identity: { Name: "Check", Level: "Component" }
                        └── button (`Element`)
                            ├── Identity: { Name: "button", Level: "Element" }
                            └── onClick (`Micro-Interaction`)
                                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: () => removeFile(file.id)"
                            └── X (`Component`)
                                ├── Identity: { Name: "X", Level: "Component" }

└── CreditNoteFormModal Component (`Component`)
    ├── Identity: { Name: "CreditNoteFormModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/CreditNoteFormModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setInvoiceId(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setAmount(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setReason(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── CreditNotesHeader Component (`Component`)
    ├── Identity: { Name: "CreditNotesHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/CreditNotesHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowModal(true)"
            └── IconPlus (`Component`)
                ├── Identity: { Name: "IconPlus", Level: "Component" }
    └── CreditNoteFormModal Section (`Section`)
        ├── Identity: { Name: "CreditNoteFormModal Section", Level: "Section" }
        └── CreditNoteFormModal (`Component`)
            ├── Identity: { Name: "CreditNoteFormModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowModal(false)"
            └── onCreated (`Micro-Interaction`)
                ├── Identity: { Name: "onCreated", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => router.refresh()"

└── InvoiceActions Component (`Component`)
    ├── Identity: { Name: "InvoiceActions Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/InvoiceActions" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSend"
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setShowVoid(true)"
    └── Alert Section (`Section`)
        ├── Identity: { Name: "Alert Section", Level: "Section" }
        └── Alert (`Component`)
            ├── Identity: { Name: "Alert", Level: "Component" }
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleVoid"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowVoid(false)"

└── InvoiceForm Component (`Component`)
    ├── Identity: { Name: "InvoiceForm Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/InvoiceForm" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── h2 (`Element`)
                        ├── Identity: { Name: "h2", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setClientId(e.target.value)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setProposalId(e.target.value)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormLabel (`Component`)
                                ├── Identity: { Name: "FormLabel", Level: "Component" }
                            └── FormSelect (`Component`)
                                ├── Identity: { Name: "FormSelect", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => setType(e.target.value)"
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormLabel (`Component`)
                                ├── Identity: { Name: "FormLabel", Level: "Component" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => setDueDate(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormTextarea (`Component`)
                            ├── Identity: { Name: "FormTextarea", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setMemo(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h2 (`Element`)
                            ├── Identity: { Name: "h2", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
                            └── onClick (`Micro-Interaction`)
                                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: addLineItem"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormLabel (`Component`)
                                ├── Identity: { Name: "FormLabel", Level: "Component" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateLineItem(index, { description: e.targ..."
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormLabel (`Component`)
                                ├── Identity: { Name: "FormLabel", Level: "Component" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateLineItem(index, { quantity: Number(e...."
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormLabel (`Component`)
                                ├── Identity: { Name: "FormLabel", Level: "Component" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateLineItem(index, { rate: Number(e.targ..."
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormLabel (`Component`)
                                ├── Identity: { Name: "FormLabel", Level: "Component" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateLineItem(index, { tax_rate: Number(e...."
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── Button (`Component`)
                                ├── Identity: { Name: "Button", Level: "Component" }
                                └── onClick (`Micro-Interaction`)
                                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: () => removeLineItem(index)"
                                └── X (`Component`)
                                    ├── Identity: { Name: "X", Level: "Component" }
                └── Alert (`Component`)
                    ├── Identity: { Name: "Alert", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => handleSave(false)"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => handleSave(true)"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── InvoicePreview (`Component`)
                    ├── Identity: { Name: "InvoicePreview", Level: "Component" }

└── InvoicePreview Component (`Component`)
    ├── Identity: { Name: "InvoicePreview Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/InvoicePreview" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }

└── InvoiceSubNav Component (`Component`)
    ├── Identity: { Name: "InvoiceSubNav Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/InvoiceSubNav" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Link (`Component`)
                ├── Identity: { Name: "Link", Level: "Component" }

└── InvoiceTabs Component (`Component`)
    ├── Identity: { Name: "InvoiceTabs Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/InvoiceTabs" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── Tabs Section (`Section`)
        ├── Identity: { Name: "Tabs Section", Level: "Section" }
        └── Tabs (`Component`)
            ├── Identity: { Name: "Tabs", Level: "Component" }
            └── onTabChange (`Micro-Interaction`)
                ├── Identity: { Name: "onTabChange", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: setActiveTab"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── SearchInput (`Component`)
                ├── Identity: { Name: "SearchInput", Level: "Component" }
                └── onChange (`Micro-Interaction`)
                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: setSearch"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => setShowImport(true)"
                    └── Upload (`Component`)
                        ├── Identity: { Name: "Upload", Level: "Component" }
                └── DataExportMenu (`Component`)
                    ├── Identity: { Name: "DataExportMenu", Level: "Component" }
    └── BulkActionBar Section (`Section`)
        ├── Identity: { Name: "BulkActionBar Section", Level: "Section" }
        └── BulkActionBar (`Component`)
            ├── Identity: { Name: "BulkActionBar", Level: "Component" }
            └── onDeselectAll (`Micro-Interaction`)
                ├── Identity: { Name: "onDeselectAll", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: deselectAll"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── Checkbox (`Component`)
                                    ├── Identity: { Name: "Checkbox", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: toggleAll"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Checkbox (`Component`)
                                    ├── Identity: { Name: "Checkbox", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: () => toggle(inv.id)"
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Link (`Component`)
                                    ├── Identity: { Name: "Link", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Badge (`Component`)
                                    ├── Identity: { Name: "Badge", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Badge (`Component`)
                                    ├── Identity: { Name: "Badge", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── RowActionMenu (`Component`)
                                    ├── Identity: { Name: "RowActionMenu", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => handleDeleteInvoice(deleteId)"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setDeleteId(null)"
    └── DataImportDialog Section (`Section`)
        ├── Identity: { Name: "DataImportDialog Section", Level: "Section" }
        └── DataImportDialog (`Component`)
            ├── Identity: { Name: "DataImportDialog", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowImport(false)"
            └── onComplete (`Micro-Interaction`)
                ├── Identity: { Name: "onComplete", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => router.refresh()"

└── PaymentRecorder Component (`Component`)
    ├── Identity: { Name: "PaymentRecorder Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/PaymentRecorder" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h2 (`Element`)
                ├── Identity: { Name: "h2", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setOpen(true)"
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setAmount(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setMethod(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setReference(e.target.value)"
                └── Alert (`Component`)
                    ├── Identity: { Name: "Alert", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => { setOpen(false); setError(null); }"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── RecurringHeader Component (`Component`)
    ├── Identity: { Name: "RecurringHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/RecurringHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowModal(true)"
            └── IconPlus (`Component`)
                ├── Identity: { Name: "IconPlus", Level: "Component" }
    └── RecurringScheduleFormModal Section (`Section`)
        ├── Identity: { Name: "RecurringScheduleFormModal Section", Level: "Section" }
        └── RecurringScheduleFormModal (`Component`)
            ├── Identity: { Name: "RecurringScheduleFormModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowModal(false)"
            └── onCreated (`Micro-Interaction`)
                ├── Identity: { Name: "onCreated", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => router.refresh()"

└── RecurringScheduleFormModal Component (`Component`)
    ├── Identity: { Name: "RecurringScheduleFormModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/invoices/RecurringScheduleFormModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setClientId(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setFrequency(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setNextIssueDate(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setEndDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── InviteMemberModal Component (`Component`)
    ├── Identity: { Name: "InviteMemberModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/InviteMemberModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Admin, Client, Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setEmail(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setRole(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setPersonalMessage(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── OrgChart Component (`Component`)
    ├── Identity: { Name: "OrgChart Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/OrgChart" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: openAddModal"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
    └── EmptyState Section (`Section`)
        ├── Identity: { Name: "EmptyState Section", Level: "Section" }
        └── EmptyState (`Component`)
            ├── Identity: { Name: "EmptyState", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── OrgNodeCard (`Component`)
                    ├── Identity: { Name: "OrgNodeCard", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: openEditModal"
    └── OrgChartPositionModal Section (`Section`)
        ├── Identity: { Name: "OrgChartPositionModal Section", Level: "Section" }
        └── OrgChartPositionModal (`Component`)
            ├── Identity: { Name: "OrgChartPositionModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setIsModalOpen(false)"
            └── onSaved (`Micro-Interaction`)
                ├── Identity: { Name: "onSaved", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => {
            setLoading(true);
            ..."

└── OrgChartPositionModal Component (`Component`)
    ├── Identity: { Name: "OrgChartPositionModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/OrgChartPositionModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setTitle(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDepartment(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setReportsTo(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setShowDeleteConfirm(true)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
                            └── onClick (`Micro-Interaction`)
                                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: onClose"
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
            └── ConfirmDialog (`Component`)
                ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
                └── onConfirm (`Micro-Interaction`)
                    ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleDelete"
                └── onCancel (`Micro-Interaction`)
                    ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setShowDeleteConfirm(false)"

└── PeopleGrid Component (`Component`)
    ├── Identity: { Name: "PeopleGrid Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/PeopleGrid" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── span (`Element`)
                ├── Identity: { Name: "span", Level: "Element" }
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setDeleteError(null)"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── ViewBar (`Component`)
                    ├── Identity: { Name: "ViewBar", Level: "Component" }
                    └── onSelectView (`Micro-Interaction`)
                        ├── Identity: { Name: "onSelectView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: setActiveViewId"
                    └── onCreateView (`Micro-Interaction`)
                        ├── Identity: { Name: "onCreateView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (opts) => createView({
              name: opts.na..."
                    └── onDeleteView (`Micro-Interaction`)
                        ├── Identity: { Name: "onDeleteView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: deleteView"
                    └── onDuplicateView (`Micro-Interaction`)
                        ├── Identity: { Name: "onDuplicateView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: duplicateView"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SearchInput (`Component`)
                        ├── Identity: { Name: "SearchInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: setSearch"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setShowImport(true)"
                        └── Upload (`Component`)
                            ├── Identity: { Name: "Upload", Level: "Component" }
                    └── DataExportMenu (`Component`)
                        ├── Identity: { Name: "DataExportMenu", Level: "Component" }
    └── EmptyState Section (`Section`)
        ├── Identity: { Name: "EmptyState Section", Level: "Section" }
        └── EmptyState (`Component`)
            ├── Identity: { Name: "EmptyState", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── RowActionMenu (`Component`)
                        ├── Identity: { Name: "RowActionMenu", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── img (`Element`)
                                ├── Identity: { Name: "img", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── Badge (`Component`)
                                ├── Identity: { Name: "Badge", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── span (`Element`)
                ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => setCurrentPage(p => Math.max(1, p - 1))"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => setCurrentPage(p => Math.min(totalPages, p +..."
    └── DataImportDialog Section (`Section`)
        ├── Identity: { Name: "DataImportDialog Section", Level: "Section" }
        └── DataImportDialog (`Component`)
            ├── Identity: { Name: "DataImportDialog", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowImport(false)"
            └── onComplete (`Micro-Interaction`)
                ├── Identity: { Name: "onComplete", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => router.refresh()"
    └── PersonEditModal Section (`Section`)
        ├── Identity: { Name: "PersonEditModal Section", Level: "Section" }
        └── PersonEditModal (`Component`)
            ├── Identity: { Name: "PersonEditModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setEditPerson(null)"
            └── onSaved (`Micro-Interaction`)
                ├── Identity: { Name: "onSaved", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => { setEditPerson(null); router.refresh(); }"
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => handleDeletePerson(deletePerson)"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setDeletePerson(null)"

└── PeopleHeader Component (`Component`)
    ├── Identity: { Name: "PeopleHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/PeopleHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowModal(true)"
            └── IconPlus (`Component`)
                ├── Identity: { Name: "IconPlus", Level: "Component" }
    └── InviteMemberModal Section (`Section`)
        ├── Identity: { Name: "InviteMemberModal Section", Level: "Section" }
        └── InviteMemberModal (`Component`)
            ├── Identity: { Name: "InviteMemberModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowModal(false)"
            └── onCreated (`Micro-Interaction`)
                ├── Identity: { Name: "onCreated", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => router.refresh()"

└── PersonDetailClient Component (`Component`)
    ├── Identity: { Name: "PersonDetailClient Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/PersonDetailClient" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setIsEditModalOpen(true)"
    └── PersonEditModal Section (`Section`)
        ├── Identity: { Name: "PersonEditModal Section", Level: "Section" }
        └── PersonEditModal (`Component`)
            ├── Identity: { Name: "PersonEditModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setIsEditModalOpen(false)"
            └── onSaved (`Micro-Interaction`)
                ├── Identity: { Name: "onSaved", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => {
            if (onUpdated) onUpdated();
  ..."

└── PersonEditModal Component (`Component`)
    ├── Identity: { Name: "PersonEditModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/PersonEditModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Admin, Client, Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setFullName(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setRole(e.target.value)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setTitle(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setDepartment(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setEmploymentType(e.target.value)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setStartDate(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setPhone(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setRateCard(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setHourlyCost(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── TimeOffCalendar Component (`Component`)
    ├── Identity: { Name: "TimeOffCalendar Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/TimeOffCalendar" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: prevMonth"
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: nextMonth"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── TimeOffClient Component (`Component`)
    ├── Identity: { Name: "TimeOffClient Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/TimeOffClient" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Admin, Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setIsRequestModalOpen(true)"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── onClick (`Micro-Interaction`)
                                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: () => setSelectedRequest(req)"
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Badge (`Component`)
                                    ├── Identity: { Name: "Badge", Level: "Component" }
    └── TimeOffRequestModal Section (`Section`)
        ├── Identity: { Name: "TimeOffRequestModal Section", Level: "Section" }
        └── TimeOffRequestModal (`Component`)
            ├── Identity: { Name: "TimeOffRequestModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setIsRequestModalOpen(false)"
            └── onCreated (`Micro-Interaction`)
                ├── Identity: { Name: "onCreated", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: fetchRequests"
    └── TimeOffDetailModal Section (`Section`)
        ├── Identity: { Name: "TimeOffDetailModal Section", Level: "Section" }
        └── TimeOffDetailModal (`Component`)
            ├── Identity: { Name: "TimeOffDetailModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setSelectedRequest(null)"
            └── onReviewed (`Micro-Interaction`)
                ├── Identity: { Name: "onReviewed", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: fetchRequests"

└── TimeOffDetailModal Component (`Component`)
    ├── Identity: { Name: "TimeOffDetailModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/TimeOffDetailModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Admin, Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── StatusBadge (`Component`)
                        ├── Identity: { Name: "StatusBadge", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: handleCancel"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => handleReview('deny')"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => handleReview('approve')"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: onClose"

└── TimeOffRequestModal Component (`Component`)
    ├── Identity: { Name: "TimeOffRequestModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/people/TimeOffRequestModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setPolicyId(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setStartDate(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setEndDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDaysRequested(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setReason(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── DealActivityForm Component (`Component`)
    ├── Identity: { Name: "DealActivityForm Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealActivityForm" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── form Section (`Section`)
        ├── Identity: { Name: "form Section", Level: "Section" }
        └── form (`Element`)
            ├── Identity: { Name: "form", Level: "Element" }
            └── onSubmit (`Micro-Interaction`)
                ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleSubmit"
            └── h3 (`Element`)
                ├── Identity: { Name: "h3", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setType(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setDescription(e.target.value)"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }

└── DealCard Component (`Component`)
    ├── Identity: { Name: "DealCard Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealCard" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Link (`Component`)
                ├── Identity: { Name: "Link", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── AlertCircle (`Component`)
                        ├── Identity: { Name: "AlertCircle", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: (e) => { e.stopPropagation(); setShowDelete(true);..."
                └── Trash2 (`Component`)
                    ├── Identity: { Name: "Trash2", Level: "Component" }
    └── Tooltip Section (`Section`)
        ├── Identity: { Name: "Tooltip Section", Level: "Section" }
        └── Tooltip (`Component`)
            ├── Identity: { Name: "Tooltip", Level: "Component" }
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleDelete"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowDelete(false)"

└── DealEditActions Component (`Component`)
    ├── Identity: { Name: "DealEditActions Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealEditActions" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setEditOpen(true)"
            └── Settings (`Component`)
                ├── Identity: { Name: "Settings", Level: "Component" }
    └── DealEditModal Section (`Section`)
        ├── Identity: { Name: "DealEditModal Section", Level: "Section" }
        └── DealEditModal (`Component`)
            ├── Identity: { Name: "DealEditModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setEditOpen(false)"
            └── onSaved (`Micro-Interaction`)
                ├── Identity: { Name: "onSaved", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => {
            setEditOpen(false);
          ..."

└── DealEditModal Component (`Component`)
    ├── Identity: { Name: "DealEditModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealEditModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setTitle(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setValue(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setProbability(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setStage(e.target.value as DealStage)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setExpectedCloseDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setLostReason(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setNotes(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── DealEmailDraft Component (`Component`)
    ├── Identity: { Name: "DealEmailDraft Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealEmailDraft" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleOpen"
            └── Send (`Component`)
                ├── Identity: { Name: "Send", Level: "Component" }
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setOpen(false)"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setTone(e.target.value as Tone)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: generateDraft"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Loader2 (`Component`)
                            ├── Identity: { Name: "Loader2", Level: "Component" }
                    └── pre (`Element`)
                        ├── Identity: { Name: "pre", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: handleCopy"
                        └── Copy (`Component`)
                            ├── Identity: { Name: "Copy", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: generateDraft"

└── DealFormModal Component (`Component`)
    ├── Identity: { Name: "DealFormModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealFormModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── onSubmit (`Micro-Interaction`)
                    ├── Identity: { Name: "onSubmit", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleSubmit"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setName(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setClientId(e.target.value)"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setValue(e.target.value)"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setProbability(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setStage(e.target.value as DealStage)"
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setExpectedCloseDate(e.target.value)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── DealNextAction Component (`Component`)
    ├── Identity: { Name: "DealNextAction Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealNextAction" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h3 (`Element`)
                ├── Identity: { Name: "h3", Level: "Element" }
                └── TrendingUp (`Component`)
                    ├── Identity: { Name: "TrendingUp", Level: "Component" }
            └── ul (`Element`)
                ├── Identity: { Name: "ul", Level: "Element" }
                └── li (`Element`)
                    ├── Identity: { Name: "li", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }

└── DealRiskAssessment Component (`Component`)
    ├── Identity: { Name: "DealRiskAssessment Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealRiskAssessment" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h3 (`Element`)
                    ├── Identity: { Name: "h3", Level: "Element" }
                    └── AlertTriangle (`Component`)
                        ├── Identity: { Name: "AlertTriangle", Level: "Component" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
            └── ul (`Element`)
                ├── Identity: { Name: "ul", Level: "Element" }
                └── li (`Element`)
                    ├── Identity: { Name: "li", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }

└── DealToInvoiceButton Component (`Component`)
    ├── Identity: { Name: "DealToInvoiceButton Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/DealToInvoiceButton" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: handleConvert"
            └── FileText (`Component`)
                ├── Identity: { Name: "FileText", Level: "Component" }

└── PipelineBoard Component (`Component`)
    ├── Identity: { Name: "PipelineBoard Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/PipelineBoard" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── PipelineFilters (`Component`)
                    ├── Identity: { Name: "PipelineFilters", Level: "Component" }
                    └── onFilterChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onFilterChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: handleFilterChange"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
            └── DndContext (`Component`)
                ├── Identity: { Name: "DndContext", Level: "Component" }
                └── onDragStart (`Micro-Interaction`)
                    ├── Identity: { Name: "onDragStart", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleDragStart"
                └── onDragEnd (`Micro-Interaction`)
                    ├── Identity: { Name: "onDragEnd", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleDragEnd"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── DroppableColumn (`Component`)
                        ├── Identity: { Name: "DroppableColumn", Level: "Component" }
                        └── DraggableDealCard (`Component`)
                            ├── Identity: { Name: "DraggableDealCard", Level: "Component" }
                └── DragOverlay (`Component`)
                    ├── Identity: { Name: "DragOverlay", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── DealCard (`Component`)
                            ├── Identity: { Name: "DealCard", Level: "Component" }

└── PipelineFilters Component (`Component`)
    ├── Identity: { Name: "PipelineFilters Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/PipelineFilters" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FormLabel (`Component`)
                    ├── Identity: { Name: "FormLabel", Level: "Component" }
                └── FormSelect (`Component`)
                    ├── Identity: { Name: "FormSelect", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => update({ owner: e.target.value })"
                    └── option (`Element`)
                        ├── Identity: { Name: "option", Level: "Element" }
                    └── option (`Element`)
                        ├── Identity: { Name: "option", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FormLabel (`Component`)
                    ├── Identity: { Name: "FormLabel", Level: "Component" }
                └── FormInput (`Component`)
                    ├── Identity: { Name: "FormInput", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => update({ minProbability: Number(e.target.va..."
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FormLabel (`Component`)
                    ├── Identity: { Name: "FormLabel", Level: "Component" }
                └── FormInput (`Component`)
                    ├── Identity: { Name: "FormInput", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => update({ maxProbability: Number(e.target.va..."
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FormLabel (`Component`)
                    ├── Identity: { Name: "FormLabel", Level: "Component" }
                └── FormInput (`Component`)
                    ├── Identity: { Name: "FormInput", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => update({ dateFrom: e.target.value })"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FormLabel (`Component`)
                    ├── Identity: { Name: "FormLabel", Level: "Component" }
                └── FormInput (`Component`)
                    ├── Identity: { Name: "FormInput", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => update({ dateTo: e.target.value })"

└── PipelineHeader Component (`Component`)
    ├── Identity: { Name: "PipelineHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/PipelineHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Button Section (`Section`)
        ├── Identity: { Name: "Button Section", Level: "Section" }
        └── Button (`Component`)
            ├── Identity: { Name: "Button", Level: "Component" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => openModal('deal')"
            └── IconPlus (`Component`)
                ├── Identity: { Name: "IconPlus", Level: "Component" }

└── PipelineTable Component (`Component`)
    ├── Identity: { Name: "PipelineTable Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/PipelineTable" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── SearchInput (`Component`)
                ├── Identity: { Name: "SearchInput", Level: "Component" }
                └── onChange (`Micro-Interaction`)
                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: setSearch"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Table (`Component`)
                ├── Identity: { Name: "Table", Level: "Component" }
                └── TableHeader (`Component`)
                    ├── Identity: { Name: "TableHeader", Level: "Component" }
                    └── TableRow (`Component`)
                        ├── Identity: { Name: "TableRow", Level: "Component" }
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── SortableHeader (`Component`)
                                ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                └── onSort (`Micro-Interaction`)
                                    ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: handleSort"
                        └── TableHead (`Component`)
                            ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                └── TableBody (`Component`)
                    ├── Identity: { Name: "TableBody", Level: "Component" }
                    └── TableRow (`Component`)
                        ├── Identity: { Name: "TableRow", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── Link (`Component`)
                                ├── Identity: { Name: "Link", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── RowActionMenu (`Component`)
                                ├── Identity: { Name: "RowActionMenu", Level: "Component" }
                    └── TableRow (`Component`)
                        ├── Identity: { Name: "TableRow", Level: "Component" }
                        └── TableCell (`Component`)
                            ├── Identity: { Name: "TableCell", Level: "Component" }
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: async () => {
            await fetch(`/api/deals/..."
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setDeleteId(null)"

└── PipelineViewSwitcher Component (`Component`)
    ├── Identity: { Name: "PipelineViewSwitcher Component", Level: "Component", Parent: "Component Library", Path: "//components/console/pipeline/PipelineViewSwitcher" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ViewTypeSwitcher (`Component`)
                ├── Identity: { Name: "ViewTypeSwitcher", Level: "Component" }
                └── onSwitch (`Micro-Interaction`)
                    ├── Identity: { Name: "onSwitch", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: (key: string) => setView(key as ViewType)"
    └── PipelineBoard Section (`Section`)
        ├── Identity: { Name: "PipelineBoard Section", Level: "Section" }
        └── PipelineBoard (`Component`)
            ├── Identity: { Name: "PipelineBoard", Level: "Component" }
    └── PipelineTable Section (`Section`)
        ├── Identity: { Name: "PipelineTable Section", Level: "Section" }
        └── PipelineTable (`Component`)
            ├── Identity: { Name: "PipelineTable", Level: "Component" }

└── BuilderStepIndicator Component (`Component`)
    ├── Identity: { Name: "BuilderStepIndicator Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/BuilderStepIndicator" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── nav Section (`Section`)
        ├── Identity: { Name: "nav Section", Level: "Section" }
        └── nav (`Element`)
            ├── Identity: { Name: "nav", Level: "Element" }
            └── ol (`Element`)
                ├── Identity: { Name: "ol", Level: "Element" }
                └── li (`Element`)
                    ├── Identity: { Name: "li", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => onStepClick(index)"
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                            └── Check (`Component`)
                                ├── Identity: { Name: "Check", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── PhaseEditorStep Component (`Component`)
    ├── Identity: { Name: "PhaseEditorStep Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/PhaseEditorStep" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => update({ name: e.target.value })"
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => update({ subtitle: e.target.value })"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── PhaseNarrativeEditor (`Component`)
                    ├── Identity: { Name: "PhaseNarrativeEditor", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (text) => update({ narrative: text })"
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── Section (`Component`)
                ├── Identity: { Name: "Section", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormSelect (`Component`)
                                ├── Identity: { Name: "FormSelect", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateCreativeRef(index, { type: e.target.v..."
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateCreativeRef(index, { label: e.target...."
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updateCreativeRef(index, { description: e.t..."
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => removeCreativeRef(index)"
                        └── X (`Component`)
                            ├── Identity: { Name: "X", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: addCreativeRef"
                    └── IconPlus (`Component`)
                        ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── Section (`Component`)
                ├── Identity: { Name: "Section", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updatePortfolioLink(index, { label: e.targe..."
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updatePortfolioLink(index, { description: e..."
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => removePortfolioLink(index)"
                        └── X (`Component`)
                            ├── Identity: { Name: "X", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: addPortfolioLink"
                    └── IconPlus (`Component`)
                        ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h3 (`Element`)
                    ├── Identity: { Name: "h3", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Table (`Component`)
                        ├── Identity: { Name: "Table", Level: "Component" }
                        └── TableHeader (`Component`)
                            ├── Identity: { Name: "TableHeader", Level: "Component" }
                            └── TableRow (`Component`)
                                ├── Identity: { Name: "TableRow", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                        └── TableBody (`Component`)
                            ├── Identity: { Name: "TableBody", Level: "Component" }
                            └── TableRow (`Component`)
                                ├── Identity: { Name: "TableRow", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── Button (`Component`)
                                        ├── Identity: { Name: "Button", Level: "Component" }
                                        └── onClick (`Micro-Interaction`)
                                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: () => setExpandedDeliverable(expandedDeliverable =..."
                                        └── ChevronUp (`Component`)
                                            ├── Identity: { Name: "ChevronUp", Level: "Component" }
                                        └── ChevronDown (`Component`)
                                            ├── Identity: { Name: "ChevronDown", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateDeliverable(index, { name: e.target.v..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateDeliverable(index, { description: e.t..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormSelect (`Component`)
                                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateDeliverable(index, { category: e.targ..."
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormSelect (`Component`)
                                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateDeliverable(index, { unit: e.target.v..."
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateDeliverable(index, { qty: Number(e.ta..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateDeliverable(index, { unitCost: Number..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── Button (`Component`)
                                        ├── Identity: { Name: "Button", Level: "Component" }
                                        └── onClick (`Micro-Interaction`)
                                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: () => removeDeliverable(index)"
                                        └── X (`Component`)
                                            ├── Identity: { Name: "X", Level: "Component" }
                            └── TableRow (`Component`)
                                ├── Identity: { Name: "TableRow", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── p (`Element`)
                                            ├── Identity: { Name: "p", Level: "Element" }
                                        └── div (`Element`)
                                            ├── Identity: { Name: "div", Level: "Element" }
                                            └── span (`Element`)
                                                ├── Identity: { Name: "span", Level: "Element" }
                                            └── FormInput (`Component`)
                                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                                └── onChange (`Micro-Interaction`)
                                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                                    └── Behavior: "Invokes: (e) => updateDetail(index, dIdx, e.target.value)"
                                            └── Button (`Component`)
                                                ├── Identity: { Name: "Button", Level: "Component" }
                                                └── onClick (`Micro-Interaction`)
                                                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                                    └── Behavior: "Invokes: () => removeDetail(index, dIdx)"
                                                └── X (`Component`)
                                                    ├── Identity: { Name: "X", Level: "Component" }
                                        └── Button (`Component`)
                                            ├── Identity: { Name: "Button", Level: "Component" }
                                            └── onClick (`Micro-Interaction`)
                                                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                                └── Behavior: "Invokes: () => addDetail(index)"
                                            └── IconPlus (`Component`)
                                                ├── Identity: { Name: "IconPlus", Level: "Component" }
                        └── tfoot (`Element`)
                            ├── Identity: { Name: "tfoot", Level: "Element" }
                            └── TableRow (`Component`)
                                ├── Identity: { Name: "TableRow", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: addDeliverable"
                    └── IconPlus (`Component`)
                        ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h3 (`Element`)
                    ├── Identity: { Name: "h3", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Table (`Component`)
                        ├── Identity: { Name: "Table", Level: "Component" }
                        └── TableHeader (`Component`)
                            ├── Identity: { Name: "TableHeader", Level: "Component" }
                            └── TableRow (`Component`)
                                ├── Identity: { Name: "TableRow", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── TableHead (`Component`)
                                    ├── Identity: { Name: "TableHead", Level: "Component" }
                        └── TableBody (`Component`)
                            ├── Identity: { Name: "TableBody", Level: "Component" }
                            └── TableRow (`Component`)
                                ├── Identity: { Name: "TableRow", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { selected: e.target.che..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { name: e.target.value }..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { description: e.target...."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormSelect (`Component`)
                                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { category: e.target.val..."
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { qty: Number(e.target.v..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { unitCost: Number(e.tar..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── FormInput (`Component`)
                                        ├── Identity: { Name: "FormInput", Level: "Component" }
                                        └── onChange (`Micro-Interaction`)
                                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: (e) => updateAddon(index, { mutuallyExclusiveGroup..."
                                └── TableCell (`Component`)
                                    ├── Identity: { Name: "TableCell", Level: "Component" }
                                    └── Button (`Component`)
                                        ├── Identity: { Name: "Button", Level: "Component" }
                                        └── onClick (`Micro-Interaction`)
                                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                            └── Behavior: "Invokes: () => removeAddon(index)"
                                        └── X (`Component`)
                                            ├── Identity: { Name: "X", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: addAddon"
                    └── IconPlus (`Component`)
                        ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── Section (`Component`)
                ├── Identity: { Name: "Section", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => updateTermsSection(index, e.target.value)"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => removeTermsSection(index)"
                        └── X (`Component`)
                            ├── Identity: { Name: "X", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: addTermsSection"
                    └── IconPlus (`Component`)
                        ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h3 (`Element`)
                    ├── Identity: { Name: "h3", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) =>
                update({ milestone: { ...ph..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) =>
                update({ milestone: { ...ph..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── FormInput (`Component`)
                                ├── Identity: { Name: "FormInput", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) => updateRequirement(index, { text: e.target.v..."
                            └── FormSelect (`Component`)
                                ├── Identity: { Name: "FormSelect", Level: "Component" }
                                └── onChange (`Micro-Interaction`)
                                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: (e) =>
                      updateRequirement(ind..."
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                            └── Button (`Component`)
                                ├── Identity: { Name: "Button", Level: "Component" }
                                └── onClick (`Micro-Interaction`)
                                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: () => removeRequirement(index)"
                                └── X (`Component`)
                                    ├── Identity: { Name: "X", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: addRequirement"
                        └── IconPlus (`Component`)
                            ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }

└── PhaseNarrativeEditor Component (`Component`)
    ├── Identity: { Name: "PhaseNarrativeEditor Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/PhaseNarrativeEditor" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── ToolbarButton (`Component`)
                    ├── Identity: { Name: "ToolbarButton", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => toggle('bold')"
                    └── Bold (`Component`)
                        ├── Identity: { Name: "Bold", Level: "Component" }
                └── ToolbarButton (`Component`)
                    ├── Identity: { Name: "ToolbarButton", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => toggle('italic')"
                    └── Italic (`Component`)
                        ├── Identity: { Name: "Italic", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── ToolbarButton (`Component`)
                    ├── Identity: { Name: "ToolbarButton", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => toggle('bulletList')"
                    └── List (`Component`)
                        ├── Identity: { Name: "List", Level: "Component" }
                └── ToolbarButton (`Component`)
                    ├── Identity: { Name: "ToolbarButton", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => toggle('orderedList')"
                    └── ListOrdered (`Component`)
                        ├── Identity: { Name: "ListOrdered", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── ToolbarButton (`Component`)
                    ├── Identity: { Name: "ToolbarButton", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => toggle('undo')"
                    └── Undo2 (`Component`)
                        ├── Identity: { Name: "Undo2", Level: "Component" }
                └── ToolbarButton (`Component`)
                    ├── Identity: { Name: "ToolbarButton", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => toggle('redo')"
                    └── Redo2 (`Component`)
                        ├── Identity: { Name: "Redo2", Level: "Component" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
            └── EditorContent (`Component`)
                ├── Identity: { Name: "EditorContent", Level: "Component" }

└── ProjectSetupStep Component (`Component`)
    ├── Identity: { Name: "ProjectSetupStep Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/ProjectSetupStep" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── fieldset (`Element`)
                ├── Identity: { Name: "fieldset", Level: "Element" }
                └── legend (`Element`)
                    ├── Identity: { Name: "legend", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ clientSearch: e.target.value })"
                    └── ul (`Element`)
                        ├── Identity: { Name: "ul", Level: "Element" }
                        └── li (`Element`)
                            ├── Identity: { Name: "li", Level: "Element" }
                            └── Button (`Component`)
                                ├── Identity: { Name: "Button", Level: "Component" }
                                └── onClick (`Micro-Interaction`)
                                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                    └── Behavior: "Invokes: () =>
                      update({
             ..."
                        └── li (`Element`)
                            ├── Identity: { Name: "li", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => update({ clientId: '', clientSearch: '' })"
            └── fieldset (`Element`)
                ├── Identity: { Name: "fieldset", Level: "Element" }
                └── legend (`Element`)
                    ├── Identity: { Name: "legend", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ projectName: e.target.value })"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ subtitle: e.target.value })"
            └── fieldset (`Element`)
                ├── Identity: { Name: "fieldset", Level: "Element" }
                └── legend (`Element`)
                    ├── Identity: { Name: "legend", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ brandVoice: e.target.value })"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ audienceProfile: e.target.value })"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ experienceGoal: e.target.value })"
            └── fieldset (`Element`)
                ├── Identity: { Name: "fieldset", Level: "Element" }
                └── legend (`Element`)
                    ├── Identity: { Name: "legend", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => update({ depositPercent: Number(e.target.va..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => update({ balancePercent: Number(e.target.va..."
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── fieldset (`Element`)
                ├── Identity: { Name: "fieldset", Level: "Element" }
                └── legend (`Element`)
                    ├── Identity: { Name: "legend", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => {
                const updated = [...(data..."
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => {
                const updated = (data.assu..."
                        └── X (`Component`)
                            ├── Identity: { Name: "X", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => update({ assumptions: [...(data.assumptions ..."
                    └── IconPlus (`Component`)
                        ├── Identity: { Name: "IconPlus", Level: "Component" }
            └── fieldset (`Element`)
                ├── Identity: { Name: "fieldset", Level: "Element" }
                └── legend (`Element`)
                    ├── Identity: { Name: "legend", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => update({ phaseTemplateId: e.target.value })"
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }

└── ReviewStep Component (`Component`)
    ├── Identity: { Name: "ReviewStep Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/ReviewStep" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── p (`Element`)
                                    ├── Identity: { Name: "p", Level: "Element" }
                                └── ul (`Element`)
                                    ├── Identity: { Name: "ul", Level: "Element" }
                                    └── li (`Element`)
                                        ├── Identity: { Name: "li", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── p (`Element`)
                                    ├── Identity: { Name: "p", Level: "Element" }
                                └── ul (`Element`)
                                    ├── Identity: { Name: "ul", Level: "Element" }
                                    └── li (`Element`)
                                        ├── Identity: { Name: "li", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── p (`Element`)
                                    ├── Identity: { Name: "p", Level: "Element" }
                                └── ul (`Element`)
                                    ├── Identity: { Name: "ul", Level: "Element" }
                                    └── li (`Element`)
                                        ├── Identity: { Name: "li", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: onSaveAsDraft"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: onSendToClient"

└── TeamStep Component (`Component`)
    ├── Identity: { Name: "TeamStep Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/TeamStep" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── FormSelect (`Component`)
                                    ├── Identity: { Name: "FormSelect", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: (e) => updateAssignment(index, { role: e.target.va..."
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── FormSelect (`Component`)
                                    ├── Identity: { Name: "FormSelect", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: (e) => updateAssignment(index, { userId: e.target...."
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── FormSelect (`Component`)
                                    ├── Identity: { Name: "FormSelect", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: (e) => updateAssignment(index, { facilityId: e.tar..."
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Button (`Component`)
                                    ├── Identity: { Name: "Button", Level: "Component" }
                                    └── onClick (`Micro-Interaction`)
                                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: () => removeAssignment(index)"
                                    └── X (`Component`)
                                        ├── Identity: { Name: "X", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: addAssignment"
                └── IconPlus (`Component`)
                    ├── Identity: { Name: "IconPlus", Level: "Component" }

└── VenueCard Component (`Component`)
    ├── Identity: { Name: "VenueCard Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/VenueCard" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => setExpanded(!expanded)"
                    └── ChevronRight (`Component`)
                        ├── Identity: { Name: "ChevronRight", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: onRemove"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, name: e.target.value }..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => {
                  onUpdate({ ...venue, ty..."
                            └── onFocus (`Micro-Interaction`)
                                ├── Identity: { Name: "onFocus", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: () => setShowTypeSuggestions(true)"
                            └── onBlur (`Micro-Interaction`)
                                ├── Identity: { Name: "onBlur", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: () => setTimeout(() => setShowTypeSuggestions(fals..."
                        └── ul (`Element`)
                            ├── Identity: { Name: "ul", Level: "Element" }
                            └── li (`Element`)
                                ├── Identity: { Name: "li", Level: "Element" }
                                └── Button (`Component`)
                                    ├── Identity: { Name: "Button", Level: "Component" }
                                    └── onMouseDown (`Micro-Interaction`)
                                        ├── Identity: { Name: "onMouseDown", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: () => {
                          onUpdate({ ...ve..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => updateAddress({ street: e.target.value })"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updateAddress({ city: e.target.value })"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updateAddress({ state: e.target.value })"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updateAddress({ zip: e.target.value })"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => updateAddress({ country: e.target.value })"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) =>
                  onUpdate({
              ..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) =>
                  onUpdate({
              ..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                        └── input (`Element`)
                            ├── Identity: { Name: "input", Level: "Element" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) =>
                  onUpdate({
              ..."
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                        └── input (`Element`)
                            ├── Identity: { Name: "input", Level: "Element" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) =>
                  onUpdate({
              ..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, loadIn: { ...venue.loa..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, loadIn: { ...venue.loa..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, loadIn: { ...venue.loa..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, strike: { ...venue.str..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, strike: { ...venue.str..."
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── FormLabel (`Component`)
                            ├── Identity: { Name: "FormLabel", Level: "Component" }
                        └── FormInput (`Component`)
                            ├── Identity: { Name: "FormInput", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => onUpdate({ ...venue, strike: { ...venue.str..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => onUpdate({ ...venue, notes: e.target.value ..."

└── VenueStep Component (`Component`)
    ├── Identity: { Name: "VenueStep Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals-builder/VenueStep" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── VenueCard (`Component`)
                    ├── Identity: { Name: "VenueCard", Level: "Component" }
                    └── onUpdate (`Micro-Interaction`)
                        ├── Identity: { Name: "onUpdate", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (v) => updateVenue(index, v)"
                    └── onRemove (`Micro-Interaction`)
                        ├── Identity: { Name: "onRemove", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => removeVenue(index)"
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: addVenue"
                └── IconPlus (`Component`)
                    ├── Identity: { Name: "IconPlus", Level: "Component" }

└── types Utility module (`Utility module`)
    ├── Identity: { Name: "types Utility module", Level: "Utility module", Parent: "Component Library", Path: "//components/console/proposals-builder/types" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Staff, Vendor, Client, Authenticated ] }

└── AIDraftProposalModal Component (`Component`)
    ├── Identity: { Name: "AIDraftProposalModal Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals/AIDraftProposalModal" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModalShell Section (`Section`)
        ├── Identity: { Name: "ModalShell Section", Level: "Section" }
        └── ModalShell (`Component`)
            ├── Identity: { Name: "ModalShell", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: onClose"
            └── Alert (`Component`)
                ├── Identity: { Name: "Alert", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormSelect (`Component`)
                        ├── Identity: { Name: "FormSelect", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setForm((p) => ({ ...p, event_type: e.targe..."
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormInput (`Component`)
                        ├── Identity: { Name: "FormInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setForm((p) => ({ ...p, estimated_budget: e..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FormLabel (`Component`)
                        ├── Identity: { Name: "FormLabel", Level: "Component" }
                    └── FormTextarea (`Component`)
                        ├── Identity: { Name: "FormTextarea", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => setForm((p) => ({ ...p, description: e.targ..."
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: handleGenerate"

└── ProposalAnalytics Component (`Component`)
    ├── Identity: { Name: "ProposalAnalytics Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals/ProposalAnalytics" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── Eye Section (`Section`)
        ├── Identity: { Name: "Eye Section", Level: "Section" }
        └── Eye (`Component`)
            ├── Identity: { Name: "Eye", Level: "Component" }
    └── Clock Section (`Section`)
        ├── Identity: { Name: "Clock Section", Level: "Section" }
        └── Clock (`Component`)
            ├── Identity: { Name: "Clock", Level: "Component" }
    └── TrendingUp Section (`Section`)
        ├── Identity: { Name: "TrendingUp Section", Level: "Section" }
        └── TrendingUp (`Component`)
            ├── Identity: { Name: "TrendingUp", Level: "Component" }
    └── Users Section (`Section`)
        ├── Identity: { Name: "Users Section", Level: "Section" }
        └── Users (`Component`)
            ├── Identity: { Name: "Users", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setTimeRange(range)"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── motion.div (`Element`)
                    ├── Identity: { Name: "motion.div", Level: "Element" }
                    └── animate (`Micro-Interaction`)
                        ├── Identity: { Name: "animate", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: { opacity: 1, y: 0 }"
                    └── Card (`Component`)
                        ├── Identity: { Name: "Card", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
            └── Card (`Component`)
                ├── Identity: { Name: "Card", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── BarChart3 (`Component`)
                        ├── Identity: { Name: "BarChart3", Level: "Component" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── div (`Element`)
                                            ├── Identity: { Name: "div", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── BarChart3 (`Component`)
                        ├── Identity: { Name: "BarChart3", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
            └── Card (`Component`)
                ├── Identity: { Name: "Card", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── MousePointer (`Component`)
                        ├── Identity: { Name: "MousePointer", Level: "Component" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── MousePointer (`Component`)
                        ├── Identity: { Name: "MousePointer", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }

└── ProposalsTable Component (`Component`)
    ├── Identity: { Name: "ProposalsTable Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals/ProposalsTable" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── PageHeader Section (`Section`)
        ├── Identity: { Name: "PageHeader Section", Level: "Section" }
        └── PageHeader (`Component`)
            ├── Identity: { Name: "PageHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setShowAiDraft(true)"
                └── Sparkles (`Component`)
                    ├── Identity: { Name: "Sparkles", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
                └── IconPlus (`Component`)
                    ├── Identity: { Name: "IconPlus", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── ViewBar (`Component`)
                    ├── Identity: { Name: "ViewBar", Level: "Component" }
                    └── onSelectView (`Micro-Interaction`)
                        ├── Identity: { Name: "onSelectView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: setActiveViewId"
                    └── onCreateView (`Micro-Interaction`)
                        ├── Identity: { Name: "onCreateView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (opts) => createView({
              name: opts.na..."
                    └── onDeleteView (`Micro-Interaction`)
                        ├── Identity: { Name: "onDeleteView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: deleteView"
                    └── onDuplicateView (`Micro-Interaction`)
                        ├── Identity: { Name: "onDuplicateView", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: duplicateView"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SearchInput (`Component`)
                        ├── Identity: { Name: "SearchInput", Level: "Component" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: setSearch"
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setShowColumnConfig(true)"
                        └── SlidersHorizontal (`Component`)
                            ├── Identity: { Name: "SlidersHorizontal", Level: "Component" }
                    └── DataExportMenu (`Component`)
                        ├── Identity: { Name: "DataExportMenu", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FilterPills (`Component`)
                    ├── Identity: { Name: "FilterPills", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: setStatusFilter"
    └── BulkActionBar Section (`Section`)
        ├── Identity: { Name: "BulkActionBar Section", Level: "Section" }
        └── BulkActionBar (`Component`)
            ├── Identity: { Name: "BulkActionBar", Level: "Component" }
            └── onDeselectAll (`Micro-Interaction`)
                ├── Identity: { Name: "onDeselectAll", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: deselectAll"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Table (`Component`)
                    ├── Identity: { Name: "Table", Level: "Component" }
                    └── TableHeader (`Component`)
                        ├── Identity: { Name: "TableHeader", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── Checkbox (`Component`)
                                    ├── Identity: { Name: "Checkbox", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: toggleAll"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── SortableHeader (`Component`)
                                    ├── Identity: { Name: "SortableHeader", Level: "Component" }
                                    └── onSort (`Micro-Interaction`)
                                        ├── Identity: { Name: "onSort", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: handleSort"
                            └── TableHead (`Component`)
                                ├── Identity: { Name: "TableHead", Level: "Component" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                    └── TableBody (`Component`)
                        ├── Identity: { Name: "TableBody", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── Checkbox (`Component`)
                                    ├── Identity: { Name: "Checkbox", Level: "Component" }
                                    └── onChange (`Micro-Interaction`)
                                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                        └── Behavior: "Invokes: () => toggle(p.id)"
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── Link (`Component`)
                                        ├── Identity: { Name: "Link", Level: "Component" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
                                └── RowActionMenu (`Component`)
                                    ├── Identity: { Name: "RowActionMenu", Level: "Component" }
                        └── TableRow (`Component`)
                            ├── Identity: { Name: "TableRow", Level: "Component" }
                            └── TableCell (`Component`)
                                ├── Identity: { Name: "TableCell", Level: "Component" }
    └── ColumnConfigPanel Section (`Section`)
        ├── Identity: { Name: "ColumnConfigPanel Section", Level: "Section" }
        └── ColumnConfigPanel (`Component`)
            ├── Identity: { Name: "ColumnConfigPanel", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowColumnConfig(false)"
            └── onColumnsChange (`Micro-Interaction`)
                ├── Identity: { Name: "onColumnsChange", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: setColumns"
            └── onRowHeightChange (`Micro-Interaction`)
                ├── Identity: { Name: "onRowHeightChange", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: setRowHeight"
    └── ConfirmDialog Section (`Section`)
        ├── Identity: { Name: "ConfirmDialog Section", Level: "Section" }
        └── ConfirmDialog (`Component`)
            ├── Identity: { Name: "ConfirmDialog", Level: "Component" }
            └── onConfirm (`Micro-Interaction`)
                ├── Identity: { Name: "onConfirm", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => handleDeleteProposal(deleteId)"
            └── onCancel (`Micro-Interaction`)
                ├── Identity: { Name: "onCancel", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setDeleteId(null)"
    └── AIDraftProposalModal Section (`Section`)
        ├── Identity: { Name: "AIDraftProposalModal Section", Level: "Section" }
        └── AIDraftProposalModal (`Component`)
            ├── Identity: { Name: "AIDraftProposalModal", Level: "Component" }
            └── onClose (`Micro-Interaction`)
                ├── Identity: { Name: "onClose", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => setShowAiDraft(false)"
            └── onDraftReady (`Micro-Interaction`)
                ├── Identity: { Name: "onDraftReady", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: (draft) => {
          // Store draft data for the..."

└── VersionComparison Component (`Component`)
    ├── Identity: { Name: "VersionComparison Component", Level: "Component", Parent: "Component Library", Path: "//components/console/proposals/VersionComparison" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── Plus Section (`Section`)
        ├── Identity: { Name: "Plus Section", Level: "Section" }
        └── Plus (`Component`)
            ├── Identity: { Name: "Plus", Level: "Component" }
    └── Minus Section (`Section`)
        ├── Identity: { Name: "Minus Section", Level: "Section" }
        └── Minus (`Component`)
            ├── Identity: { Name: "Minus", Level: "Component" }
    └── Edit2 Section (`Section`)
        ├── Identity: { Name: "Edit2 Section", Level: "Section" }
        └── Edit2 (`Component`)
            ├── Identity: { Name: "Edit2", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setSelectedFromVersion(e.target.value ? Num..."
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── ArrowRight (`Component`)
                        ├── Identity: { Name: "ArrowRight", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── FormSelect (`Component`)
                            ├── Identity: { Name: "FormSelect", Level: "Component" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: (e) => setSelectedToVersion(e.target.value ? Numbe..."
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
            └── Card (`Component`)
                ├── Identity: { Name: "Card", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Clock (`Component`)
                        ├── Identity: { Name: "Clock", Level: "Component" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── GitCompare (`Component`)
                        ├── Identity: { Name: "GitCompare", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── motion.div (`Element`)
                        ├── Identity: { Name: "motion.div", Level: "Element" }
                        └── animate (`Micro-Interaction`)
                            ├── Identity: { Name: "animate", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: { opacity: 1, x: 0 }"
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
            └── Card (`Component`)
                ├── Identity: { Name: "Card", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── GitCompare (`Component`)
                        ├── Identity: { Name: "GitCompare", Level: "Component" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── motion.div (`Element`)
                        ├── Identity: { Name: "motion.div", Level: "Element" }
                        └── animate (`Micro-Interaction`)
                            ├── Identity: { Name: "animate", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: { opacity: 1, y: 0 }"
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── ul (`Element`)
                            ├── Identity: { Name: "ul", Level: "Element" }
                            └── li (`Element`)
                                ├── Identity: { Name: "li", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }

└── DataTable Component (`Component`)
    ├── Identity: { Name: "DataTable Component", Level: "Component", Parent: "Component Library", Path: "//components/data/DataTable" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── table (`Element`)
                ├── Identity: { Name: "table", Level: "Element" }
                └── thead (`Element`)
                    ├── Identity: { Name: "thead", Level: "Element" }
                    └── tr (`Element`)
                        ├── Identity: { Name: "tr", Level: "Element" }
                        └── th (`Element`)
                            ├── Identity: { Name: "th", Level: "Element" }
                └── tbody (`Element`)
                    ├── Identity: { Name: "tbody", Level: "Element" }
                    └── tr (`Element`)
                        ├── Identity: { Name: "tr", Level: "Element" }
                        └── td (`Element`)
                            ├── Identity: { Name: "td", Level: "Element" }

└── EmptyState Component (`Component`)
    ├── Identity: { Name: "EmptyState Component", Level: "Component", Parent: "Component Library", Path: "//components/data/EmptyState" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }

└── SectionHeading Component (`Component`)
    ├── Identity: { Name: "SectionHeading Component", Level: "Component", Parent: "Component Library", Path: "//components/data/SectionHeading" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── h2 (`Element`)
                ├── Identity: { Name: "h2", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── StatCard Component (`Component`)
    ├── Identity: { Name: "StatCard Component", Level: "Component", Parent: "Component Library", Path: "//components/data/StatCard" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }

└── StatusBadge Component (`Component`)
    ├── Identity: { Name: "StatusBadge Component", Level: "Component", Parent: "Component Library", Path: "//components/data/StatusBadge" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor ] }
    └── Internal Components:
    └── Badge Section (`Section`)
        ├── Identity: { Name: "Badge Section", Level: "Section" }
        └── Badge (`Component`)
            ├── Identity: { Name: "Badge", Level: "Component" }

└── index Utility module (`Utility module`)
    ├── Identity: { Name: "index Utility module", Level: "Utility module", Parent: "Component Library", Path: "//components/data/index" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── ContentGrid Component (`Component`)
    ├── Identity: { Name: "ContentGrid Component", Level: "Component", Parent: "Component Library", Path: "//components/layout/ContentGrid" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── MobileFieldOpsLayout Component (`Component`)
    ├── Identity: { Name: "MobileFieldOpsLayout Component", Level: "Component", Parent: "Component Library", Path: "//components/layout/MobileFieldOpsLayout" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── header (`Element`)
                ├── Identity: { Name: "header", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
            └── main (`Element`)
                ├── Identity: { Name: "main", Level: "Element" }
            └── nav (`Element`)
                ├── Identity: { Name: "nav", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                        └── svg (`Element`)
                            ├── Identity: { Name: "svg", Level: "Element" }
                            └── path (`Element`)
                                ├── Identity: { Name: "path", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }

└── ModuleHeader Component (`Component`)
    ├── Identity: { Name: "ModuleHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/layout/ModuleHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── header Section (`Section`)
        ├── Identity: { Name: "header Section", Level: "Section" }
        └── header (`Element`)
            ├── Identity: { Name: "header", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── a (`Element`)
                        ├── Identity: { Name: "a", Level: "Element" }
                    └── h1 (`Element`)
                        ├── Identity: { Name: "h1", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }

└── PageShell Component (`Component`)
    ├── Identity: { Name: "PageShell Component", Level: "Component", Parent: "Component Library", Path: "//components/layout/PageShell" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── Sidebar Component (`Component`)
    ├── Identity: { Name: "Sidebar Component", Level: "Component", Parent: "Component Library", Path: "//components/layout/Sidebar" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client ] }
    └── Internal Components:
    └── aside Section (`Section`)
        ├── Identity: { Name: "aside Section", Level: "Section" }
        └── aside (`Element`)
            ├── Identity: { Name: "aside", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── nav (`Element`)
                ├── Identity: { Name: "nav", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Avatar (`Component`)
                        ├── Identity: { Name: "Avatar", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── ThemeToggle (`Component`)
                        ├── Identity: { Name: "ThemeToggle", Level: "Component" }
                └── form (`Element`)
                    ├── Identity: { Name: "form", Level: "Element" }
                    └── action (`Micro-Interaction`)
                        ├── Identity: { Name: "action", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: Dynamic Handler"
                    └── button (`Element`)
                        ├── Identity: { Name: "button", Level: "Element" }

└── index Utility module (`Utility module`)
    ├── Identity: { Name: "index Utility module", Level: "Utility module", Parent: "Component Library", Path: "//components/layout/index" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── AlertBanner Component (`Component`)
    ├── Identity: { Name: "AlertBanner Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/AlertBanner" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── CheckInScanner Component (`Component`)
    ├── Identity: { Name: "CheckInScanner Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/CheckInScanner" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── AlertBanner (`Component`)
                    ├── Identity: { Name: "AlertBanner", Level: "Component" }
                └── AlertBanner (`Component`)
                    ├── Identity: { Name: "AlertBanner", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Input (`Component`)
                    ├── Identity: { Name: "Input", Level: "Component" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: (e) => setQuery(e.target.value)"
                    └── onKeyDown (`Micro-Interaction`)
                        ├── Identity: { Name: "onKeyDown", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: handleScan"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── CredentialAssetLinker Component (`Component`)
    ├── Identity: { Name: "CredentialAssetLinker Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/CredentialAssetLinker" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h4 (`Element`)
                ├── Identity: { Name: "h4", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── input (`Element`)
                    ├── Identity: { Name: "input", Level: "Element" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: e => setItemId(e.target.value)"
                └── input (`Element`)
                    ├── Identity: { Name: "input", Level: "Element" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: e => setQuantity(parseInt(e.target.value) || 1)"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: handleLink"

└── DetailPanel Component (`Component`)
    ├── Identity: { Name: "DetailPanel Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/DetailPanel" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h3 (`Element`)
                ├── Identity: { Name: "h3", Level: "Element" }
            └── dl (`Element`)
                ├── Identity: { Name: "dl", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── dt (`Element`)
                        ├── Identity: { Name: "dt", Level: "Element" }
                    └── dd (`Element`)
                        ├── Identity: { Name: "dd", Level: "Element" }

└── KanbanBoard Component (`Component`)
    ├── Identity: { Name: "KanbanBoard Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/KanbanBoard" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }

└── RRuleBuilder Component (`Component`)
    ├── Identity: { Name: "RRuleBuilder Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/RRuleBuilder" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── label (`Element`)
                ├── Identity: { Name: "label", Level: "Element" }
                └── input (`Element`)
                    ├── Identity: { Name: "input", Level: "Element" }
                    └── onChange (`Micro-Interaction`)
                        ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: handleToggle"
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                    └── select (`Element`)
                        ├── Identity: { Name: "select", Level: "Element" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: e => {
                setFreq(e.target.value as R..."
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                        └── option (`Element`)
                            ├── Identity: { Name: "option", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── input (`Element`)
                            ├── Identity: { Name: "input", Level: "Element" }
                            └── onChange (`Micro-Interaction`)
                                ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: e => {
                   const v = parseInt(e.tar..."
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── button (`Element`)
                            ├── Identity: { Name: "button", Level: "Element" }
                            └── onClick (`Micro-Interaction`)
                                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: () => toggleDay(d.id)"
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                    └── input (`Element`)
                        ├── Identity: { Name: "input", Level: "Element" }
                        └── onChange (`Micro-Interaction`)
                            ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => {
                const u = e.target.value;..."

└── ScheduleTimeline Component (`Component`)
    ├── Identity: { Name: "ScheduleTimeline Component", Level: "Component", Parent: "Component Library", Path: "//components/modules/ScheduleTimeline" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── index Utility module (`Utility module`)
    ├── Identity: { Name: "index Utility module", Level: "Utility module", Parent: "Component Library", Path: "//components/modules/index" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── GlobalProfileProvider Component (`Component`)
    ├── Identity: { Name: "GlobalProfileProvider Component", Level: "Component", Parent: "Component Library", Path: "//components/providers/GlobalProfileProvider" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── GlobalProfileContext.Provider Section (`Section`)
        ├── Identity: { Name: "GlobalProfileContext.Provider Section", Level: "Section" }
        └── GlobalProfileContext.Provider (`Component`)
            ├── Identity: { Name: "GlobalProfileContext.Provider", Level: "Component" }

└── OrgContextProvider Component (`Component`)
    ├── Identity: { Name: "OrgContextProvider Component", Level: "Component", Parent: "Component Library", Path: "//components/providers/OrgContextProvider" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── OrganizationContext.Provider Section (`Section`)
        ├── Identity: { Name: "OrganizationContext.Provider Section", Level: "Section" }
        └── OrganizationContext.Provider (`Component`)
            ├── Identity: { Name: "OrganizationContext.Provider", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── ThemeProvider Component (`Component`)
    ├── Identity: { Name: "ThemeProvider Component", Level: "Component", Parent: "Component Library", Path: "//components/providers/ThemeProvider" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── ThemeContext.Provider Section (`Section`)
        ├── Identity: { Name: "ThemeContext.Provider Section", Level: "Section" }
        └── ThemeContext.Provider (`Component`)
            ├── Identity: { Name: "ThemeContext.Provider", Level: "Component" }

└── BulkActionBar Component (`Component`)
    ├── Identity: { Name: "BulkActionBar Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/BulkActionBar" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── ColumnConfigPanel Component (`Component`)
    ├── Identity: { Name: "ColumnConfigPanel Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/ColumnConfigPanel" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── ConfirmDialog Component (`Component`)
    ├── Identity: { Name: "ConfirmDialog Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/ConfirmDialog" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── DataExportMenu Component (`Component`)
    ├── Identity: { Name: "DataExportMenu Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/DataExportMenu" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── DataImportDialog Component (`Component`)
    ├── Identity: { Name: "DataImportDialog Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/DataImportDialog" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── GlobalModalProvider Component (`Component`)
    ├── Identity: { Name: "GlobalModalProvider Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/GlobalModalProvider" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── ModalContext.Provider Section (`Section`)
        ├── Identity: { Name: "ModalContext.Provider Section", Level: "Section" }
        └── ModalContext.Provider (`Component`)
            ├── Identity: { Name: "ModalContext.Provider", Level: "Component" }

└── PageHeader Component (`Component`)
    ├── Identity: { Name: "PageHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/PageHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── RowActionMenu Component (`Component`)
    ├── Identity: { Name: "RowActionMenu Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/RowActionMenu" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── SortableHeader Component (`Component`)
    ├── Identity: { Name: "SortableHeader Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/SortableHeader" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── ViewBar Component (`Component`)
    ├── Identity: { Name: "ViewBar Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/ViewBar" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => onSelectView(v.id)"

└── ViewTypeSwitcher Component (`Component`)
    ├── Identity: { Name: "ViewTypeSwitcher Component", Level: "Component", Parent: "Component Library", Path: "//components/shared/ViewTypeSwitcher" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── Alert Component (`Component`)
    ├── Identity: { Name: "Alert Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Alert" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Icon (`Component`)
                ├── Identity: { Name: "Icon", Level: "Component" }
            └── h5 (`Element`)
                ├── Identity: { Name: "h5", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: onClose"
                └── X (`Component`)
                    ├── Identity: { Name: "X", Level: "Component" }

└── Avatar Component (`Component`)
    ├── Identity: { Name: "Avatar Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Avatar" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── Badge Component (`Component`)
    ├── Identity: { Name: "Badge Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Badge" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }

└── Button Component (`Component`)
    ├── Identity: { Name: "Button Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Button" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── Link Section (`Section`)
        ├── Identity: { Name: "Link Section", Level: "Section" }
        └── Link (`Component`)
            ├── Identity: { Name: "Link", Level: "Component" }
    └── button Section (`Section`)
        ├── Identity: { Name: "button Section", Level: "Section" }
        └── button (`Element`)
            ├── Identity: { Name: "button", Level: "Element" }

└── Card Component (`Component`)
    ├── Identity: { Name: "Card Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Card" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
    └── h3 Section (`Section`)
        ├── Identity: { Name: "h3 Section", Level: "Section" }
        └── h3 (`Element`)
            ├── Identity: { Name: "h3", Level: "Element" }
    └── p Section (`Section`)
        ├── Identity: { Name: "p Section", Level: "Section" }
        └── p (`Element`)
            ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── Checkbox Component (`Component`)
    ├── Identity: { Name: "Checkbox Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Checkbox" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── input Section (`Section`)
        ├── Identity: { Name: "input Section", Level: "Section" }
        └── input (`Element`)
            ├── Identity: { Name: "input", Level: "Element" }

└── EmptyState Component (`Component`)
    ├── Identity: { Name: "EmptyState Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/EmptyState" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── FileMinus (`Component`)
                    ├── Identity: { Name: "FileMinus", Level: "Component" }
            └── h3 (`Element`)
                ├── Identity: { Name: "h3", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── FilterPills Component (`Component`)
    ├── Identity: { Name: "FilterPills Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/FilterPills" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── button Section (`Section`)
        ├── Identity: { Name: "button Section", Level: "Section" }
        └── button (`Element`)
            ├── Identity: { Name: "button", Level: "Element" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => onChange(val)"
            └── span (`Element`)
                ├── Identity: { Name: "span", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── FormInput Component (`Component`)
    ├── Identity: { Name: "FormInput Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/FormInput" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── input Section (`Section`)
        ├── Identity: { Name: "input Section", Level: "Section" }
        └── input (`Element`)
            ├── Identity: { Name: "input", Level: "Element" }

└── FormLabel Component (`Component`)
    ├── Identity: { Name: "FormLabel Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/FormLabel" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── label Section (`Section`)
        ├── Identity: { Name: "label Section", Level: "Section" }
        └── label (`Element`)
            ├── Identity: { Name: "label", Level: "Element" }

└── FormSelect Component (`Component`)
    ├── Identity: { Name: "FormSelect Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/FormSelect" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── select Section (`Section`)
        ├── Identity: { Name: "select Section", Level: "Section" }
        └── select (`Element`)
            ├── Identity: { Name: "select", Level: "Element" }

└── FormTextarea Component (`Component`)
    ├── Identity: { Name: "FormTextarea Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/FormTextarea" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── textarea Section (`Section`)
        ├── Identity: { Name: "textarea Section", Level: "Section" }
        └── textarea (`Element`)
            ├── Identity: { Name: "textarea", Level: "Element" }

└── Icons Component (`Component`)
    ├── Identity: { Name: "Icons Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Icons" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── Input Component (`Component`)
    ├── Identity: { Name: "Input Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Input" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── label (`Element`)
                ├── Identity: { Name: "label", Level: "Element" }
            └── input (`Element`)
                ├── Identity: { Name: "input", Level: "Element" }
            └── span (`Element`)
                ├── Identity: { Name: "span", Level: "Element" }

└── ModalShell Component (`Component`)
    ├── Identity: { Name: "ModalShell Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/ModalShell" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: onClose"
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h2 (`Element`)
                            ├── Identity: { Name: "h2", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── button (`Element`)
                        ├── Identity: { Name: "button", Level: "Element" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: onClose"
                        └── X (`Component`)
                            ├── Identity: { Name: "X", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }

└── ProgressBar Component (`Component`)
    ├── Identity: { Name: "ProgressBar Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/ProgressBar" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
            └── span (`Element`)
                ├── Identity: { Name: "span", Level: "Element" }

└── SearchInput Component (`Component`)
    ├── Identity: { Name: "SearchInput Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/SearchInput" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Search (`Component`)
                ├── Identity: { Name: "Search", Level: "Component" }
            └── Input (`Component`)
                ├── Identity: { Name: "Input", Level: "Component" }
                └── onChange (`Micro-Interaction`)
                    ├── Identity: { Name: "onChange", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: (e: React.ChangeEvent<HTMLInputElement>) => {
    ..."
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: handleClear"
                └── X (`Component`)
                    ├── Identity: { Name: "X", Level: "Component" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }

└── StatusBadge Component (`Component`)
    ├── Identity: { Name: "StatusBadge Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/StatusBadge" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Admin, Client ] }
    └── Internal Components:
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }

└── Table Component (`Component`)
    ├── Identity: { Name: "Table Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Table" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── table Section (`Section`)
        ├── Identity: { Name: "table Section", Level: "Section" }
        └── table (`Element`)
            ├── Identity: { Name: "table", Level: "Element" }
    └── thead Section (`Section`)
        ├── Identity: { Name: "thead Section", Level: "Section" }
        └── thead (`Element`)
            ├── Identity: { Name: "thead", Level: "Element" }
    └── tbody Section (`Section`)
        ├── Identity: { Name: "tbody Section", Level: "Section" }
        └── tbody (`Element`)
            ├── Identity: { Name: "tbody", Level: "Element" }
    └── tr Section (`Section`)
        ├── Identity: { Name: "tr Section", Level: "Section" }
        └── tr (`Element`)
            ├── Identity: { Name: "tr", Level: "Element" }
    └── th Section (`Section`)
        ├── Identity: { Name: "th Section", Level: "Section" }
        └── th (`Element`)
            ├── Identity: { Name: "th", Level: "Element" }
    └── td Section (`Section`)
        ├── Identity: { Name: "td Section", Level: "Section" }
        └── td (`Element`)
            ├── Identity: { Name: "td", Level: "Element" }

└── Tabs Component (`Component`)
    ├── Identity: { Name: "Tabs Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Tabs" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── TabsContext.Provider Section (`Section`)
        ├── Identity: { Name: "TabsContext.Provider Section", Level: "Section" }
        └── TabsContext.Provider (`Component`)
            ├── Identity: { Name: "TabsContext.Provider", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── TabsList (`Component`)
                    ├── Identity: { Name: "TabsList", Level: "Component" }
                    └── TabsTrigger (`Component`)
                        ├── Identity: { Name: "TabsTrigger", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
    └── button Section (`Section`)
        ├── Identity: { Name: "button Section", Level: "Section" }
        └── button (`Element`)
            ├── Identity: { Name: "button", Level: "Element" }
            └── onClick (`Micro-Interaction`)
                ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                └── Behavior: "Invokes: () => ctx?.onValueChange(value)"
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── ThemeToggle Component (`Component`)
    ├── Identity: { Name: "ThemeToggle Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/ThemeToggle" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setTheme('light')"
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setTheme('system')"
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }
                └── onClick (`Micro-Interaction`)
                    ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: () => setTheme('dark')"

└── Tooltip Component (`Component`)
    ├── Identity: { Name: "Tooltip Component", Level: "Component", Parent: "Component Library", Path: "//components/ui/Tooltip" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }
    └── Internal Components:
    └── TooltipContext.Provider Section (`Section`)
        ├── Identity: { Name: "TooltipContext.Provider Section", Level: "Section" }
        └── TooltipContext.Provider (`Component`)
            ├── Identity: { Name: "TooltipContext.Provider", Level: "Component" }
    └── TooltipProvider Section (`Section`)
        ├── Identity: { Name: "TooltipProvider Section", Level: "Section" }
        └── TooltipProvider (`Component`)
            ├── Identity: { Name: "TooltipProvider", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── TooltipTrigger (`Component`)
                    ├── Identity: { Name: "TooltipTrigger", Level: "Component" }
                └── TooltipContent (`Component`)
                    ├── Identity: { Name: "TooltipContent", Level: "Component" }
    └── TooltipProvider Section (`Section`)
        ├── Identity: { Name: "TooltipProvider Section", Level: "Section" }
        └── TooltipProvider (`Component`)
            ├── Identity: { Name: "TooltipProvider", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }

└── index Utility module (`Utility module`)
    ├── Identity: { Name: "index Utility module", Level: "Utility module", Parent: "Component Library", Path: "//components/ui/index" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

```

## Quality Flags

| Flag Type | Finding |
|---|---|
| **Orphaned Elements** | 0 detected |
| **Dead-End Workflows** | 0 mapped pages without explicit action triggers/forms |
| **Permission Gaps** | 0 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |
