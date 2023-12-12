import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { PickList } from "primereact/picklist";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCirclePlus,
  faRotateBack,
  faPencil,
  faUsers,
  faUsersSlash,
  faSave,
  faTrashCan,
  faXmark,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { ShoppingListService } from "../Service";
import ItemInput from "./ItemInput";
import Progress from "./Progress";
import ErrorResponse from "./ErrorResponse";
import { Dropdown } from "primereact/dropdown";
import StatusTag from "./StatusTag";
import DateTag from "./DateTag";

function ItemsList() {
  const { id } = useParams();
  let emptyList = {
    id: "",
    title: "",
    status: "",
    owner: "",
    created_at: "",
    items: [],
    members: [],
  };

  let emptyItem = {
    id: "",
    title: "",
    note: "",
    status: "",
    creator: "",
    created_at: "",
  };

  let emptyMember = {
    email: "",
    created_at: "",
    avatar: "",
    id: "",
  };

  const [items, setItems] = useState([]);
  const [item, setItem] = useState(emptyItem);
  const [list, setList] = useState(emptyList);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [owner, setOwner] = useState(emptyMember);
  const [deleteItemDialog, setDeleteItemDialog] = useState(false);
  const [deleteMemberDialog, setDeleteMemberDialog] = useState(false);
  const [listTitleDialog, setListTitleDialog] = useState(false);
  const [addItemDialog, setAddItemDialog] = useState(false);
  const [membersDialog, setMembersDialog] = useState(false);
  const [member, setMember] = useState(emptyMember);
  const [submitted, setSubmitted] = useState(false);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const toast = useRef(null);
  const dt = useRef(null);
  const [statuses] = useState(["new", "done"]);
  const [callStatus, setCallStatus] = useState({ state: "pending" });
  let navigate = useNavigate();

  useEffect(() => {
    ShoppingListService.getUser()
      .then(async (res) => {
        const userJson = await res.json();
        if (res.ok) {
          setUser(userJson);
          return true;
        } else {
          console.log(res);
          setCallStatus({ state: "auth" });
          return false;
        }
      })
      .then((auth) => {
        if (auth) {
          ShoppingListService.getShoppingList(id).then(async (response) => {
            const responseJson = await response.json();
            switch (response.status) {
              case 200:
                console.log(responseJson);
                setList(responseJson);
                setMembers(responseJson.members);
                setItems(responseJson.items);
                setOwner(
                  responseJson.members.filter(
                    (m) => m.id === responseJson.owner
                  )
                );
                ShoppingListService.getUsers().then(async (res) => {
                  const usersJson = await res.json();
                  console.log(usersJson);
                  if (res.ok) {
                    let _users = usersJson.filter(
                      (obj) =>
                        !responseJson.members.some(({ id }) => obj.id === id)
                    );
                    console.log(_users[0]);
                    setUsers(_users);
                    console.log(users);
                  }
                });
                setCallStatus({ state: "ok" });
                break;
              case 401:
                console.log(response);
                setCallStatus({ state: "auth" });
                break;
              default:
                console.log(response);
                setCallStatus({
                  state: "error",
                  status: response.status,
                  statusText: response.statusText,
                  message: responseJson.message,
                });
                break;
            }
          });
        }
      });
  }, []);

  const deleteItem = () => {
    ShoppingListService.deleteListItem(item.id).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          let _items = items.filter((e) => e.id !== item.id);
          setItems(_items);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Položka ${item.title} byla smazána`,
            life: 3000,
          });
          break;
        case 401:
          console.log(response);
          setCallStatus({ state: "auth" });
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Nejste přihlášen`,
            life: 3000,
          });
          break;
        default:
          console.log(response);
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Něco se pokazilo ${responseJson.message}`,
            life: 3000,
          });
          break;
      }
    });
    setDeleteItemDialog(false);
    setItem(emptyItem);
  };

  const deleteMember = () => {
    let _members = members.filter((e) => e.id !== user.id);
    let _list = list;
    _list.members = _members;
    ShoppingListService.putShoppingList(_list).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Byl jste odstraněn jako člen`,
            life: 3000,
          });
          setDeleteMemberDialog(false);
          navigate("/");
          break;
        case 401:
          console.log(response);
          setCallStatus({ state: "auth" });
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Nejste přihlášen`,
            life: 3000,
          });
          break;
        default:
          console.log(response);
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Něco se pokazilo ${responseJson.message}`,
            life: 3000,
          });
          break;
      }
    });
  };

  const saveListTitle = (values) => {
    setSubmitted(true);
    let _list = list;
    _list.title = values.title;
    ShoppingListService.putShoppingList(_list).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          setList(responseJson);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Nový název byl uložen.`,
            life: 3000,
          });
          break;
        case 401:
          console.log(response);
          setCallStatus({ state: "auth" });
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Nejste přihlášen`,
            life: 3000,
          });
          break;
        default:
          console.log(response);
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Něco se pokazilo ${responseJson.message}`,
            life: 3000,
          });
          break;
      }
    });
    setListTitleDialog(false);
  };

  const changeItemStatus = (item) => {
    let _item = item;
    if (_item.status === "new") {
      _item.status = "done";
    } else if (_item.status === "done") {
      _item.status = "new";
    }
    ShoppingListService.putListItem(_item).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          let _items = [...items];
          _items.push(responseJson);
          list.items = _items;
          setList(list);
          setItems(_items);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Položce ${_item.title} byl změněn stav.`,
            life: 3000,
          });
          break;
        case 401:
          console.log(response);
          setCallStatus({ state: "auth" });
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Nejste přihlášen`,
            life: 3000,
          });
          break;
        default:
          console.log(response);
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Něco se pokazilo ${responseJson.message}`,
            life: 3000,
          });
          break;
      }
    });
  };

  const saveItem = (values) => {
    setSubmitted(true);
    ShoppingListService.postListItem(values).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          let _items = [...items];
          _items.push(responseJson);
          setItems(_items);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Položka ${values.title} byla přidána na seznam`,
            life: 3000,
          });
          break;
        case 401:
          console.log(response);
          setCallStatus({ state: "auth" });
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Nejste přihlášen`,
            life: 3000,
          });
          break;
        default:
          console.log(response);
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Něco se pokazilo ${responseJson.message}`,
            life: 3000,
          });
          break;
      }
    });
    setAddItemDialog(false);
  };

  const confirmDeleteItem = (i) => {
    setItem(i);
    setDeleteItemDialog(true);
  };

  const confirmDeleteMember = (m) => {
    setMember(m);
    setDeleteMemberDialog(true);
  };

  const hideListTitleDialog = () => {
    setSubmitted(false);
    setListTitleDialog(false);
  };

  const hideAddItemDialog = () => {
    setSubmitted(false);
    setAddItemDialog(false);
  };

  const hideDeleteItemDialog = () => {
    setDeleteItemDialog(false);
  };

  const hideDeleteMemberDialog = () => {
    setDeleteMemberDialog(false);
  };

  const hideMembersDialog = () => {
    setMembersDialog(false);
  };

  const leftToolbarTemplate = () => {
    if (members.find((member) => member.id === user.id))
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            label="Nová položka"
            icon={<FontAwesomeIcon className="mr-1" icon={faCirclePlus} />}
            severity="success"
            onClick={() => setAddItemDialog(true)}
          />
        </div>
      );
  };

  const rightToolbarTemplate = () => {
    if (owner.id === user.id) {
      return (
        <Button
          label="Členi"
          icon={<FontAwesomeIcon icon={faUsers} className="mr-1" />}
          className="p-button-help"
          onClick={() => setMembersDialog(true)}
        />
      );
    } else if (members.find((member) => member.id === user.id)) {
      return (
        <Button
          label="Odstranit se jako člen"
          icon={<FontAwesomeIcon icon={faUsersSlash} className="mr-1" />}
          className="p-button-help"
          onClick={() => confirmDeleteMember(user)}
        />
      );
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon={<FontAwesomeIcon icon={faRotateBack} />}
          rounded
          outlined
          className="mr-3"
          visible={
            rowData.status === "done" &&
            (user.id === rowData.owner || owner.id === user.id)
          }
          severity="warning"
          onClick={() => changeItemStatus(rowData)}
        />
        <Button
          icon={<FontAwesomeIcon icon={faCheck} />}
          rounded
          outlined
          className="mr-3"
          visible={
            rowData.status === "new" &&
            (members.find((member) => member.id === user.id) ||
              owner.id === user.id)
          }
          severity="success"
          onClick={() => changeItemStatus(rowData)}
        />
        <Button
          icon={<FontAwesomeIcon icon={faTrashCan} />}
          rounded
          outlined
          visible={user.id === rowData.owner || owner.id === user.id}
          severity="danger"
          onClick={() => confirmDeleteItem(rowData)}
        />
      </React.Fragment>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex flex-wrap gap-2 align-items-center justify-content-start">
        <h4 className="m-0">{list.title}</h4>
        <Button
          icon={<FontAwesomeIcon icon={faPencil} />}
          rounded
          outlined
          className="m-0"
          severity="info"
          visible={owner && user && owner.id === user.id}
          onClick={() => setListTitleDialog(true)}
        />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center justify-content-end">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            onInput={(e) => setGlobalFilter(e.target.value)}
            placeholder="Hledat..."
          />
        </span>
      </div>
    </div>
  );

  const itemUserTemplate = (user) => {
    return (
      <div className="flex flex-wrap p-2 align-items-center gap-1">
        <FontAwesomeIcon
          className="w-1rem shadow-2 flex-shrink-0 border-round"
          icon={faUser}
        />
        <div className="flex-1 flex flex-column gap-1">
          <span>{user.email}</span>
        </div>
      </div>
    );
  };

  const deleteItemDialogFooter = (
    <React.Fragment>
      <Button
        label="Ne"
        icon={<FontAwesomeIcon icon={faXmark} className="mr-1" />}
        outlined
        onClick={() => setDeleteItemDialog(false)}
      />
      <Button
        label="Ano"
        icon={<FontAwesomeIcon icon={faCheck} className="mr-1" />}
        severity="danger"
        onClick={deleteItem}
      />
    </React.Fragment>
  );

  const deleteMemberDialogFooter = (
    <React.Fragment>
      <Button
        label="Ne"
        icon={<FontAwesomeIcon icon={faXmark} className="mr-1" />}
        outlined
        onClick={() => setDeleteMemberDialog(false)}
      />
      <Button
        label="Ano"
        icon={<FontAwesomeIcon icon={faCheck} className="mr-1" />}
        severity="danger"
        onClick={deleteMember}
      />
    </React.Fragment>
  );

  const onMemberChange = (event) => {
    let _list = list;
    _list.members = event.target;
    ShoppingListService.putShoppingList(_list).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          setList(responseJson);
          setUsers(event.source);
          setMembers(event.target);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Členi byli změněni`,
            life: 3000,
          });
          break;
        case 401:
          console.log(response);
          setCallStatus({ state: "auth" });
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Nejste přihlášen`,
            life: 3000,
          });
          break;
        default:
          console.log(response);
          toast.current.show({
            severity: "danger",
            summary: "Chyba",
            detail: `Něco se pokazilo ${responseJson.message}`,
            life: 3000,
          });
          break;
      }
    });
    setListTitleDialog(false);
  };

  const statusBodyTemplate = (item) => {
    return <StatusTag status={item.status} />;
  };

  const statusItemTemplate = (option) => {
    return <StatusTag status={option} />;
  };

  const dateBodyTemplate = (option) => {
    return <DateTag date={option.created_at} />;
  };

  const statusRowFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={statuses}
        onChange={(e) => options.filterApplyCallback(e.value)}
        itemTemplate={statusItemTemplate}
        placeholder="Vyberte..."
        className="p-column-filter"
        showClear
        style={{ minWidth: "12rem" }}
      />
    );
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };

    _filters["global"].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  switch (callStatus.state) {
    case "ok":
      return (
        <div>
          <Toast ref={toast} />
          <br />
          <div className="card m-3 justify-content-center">
            <Toolbar
              className="mb-4"
              start={leftToolbarTemplate}
              end={rightToolbarTemplate}
            />

            <DataTable
              ref={dt}
              value={items}
              dataKey="id"
              filters={filters}
              filterDisplay="row"
              // paginator
              // rows={10}
              // rowsPerPageOptions={[5, 10, 25]}
              // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              // currentPageReportTemplate="Ukázka od {first} do {last} z celkem {totalRecords} položek"
              globalFilter={globalFilter}
              header={header}
            >
              <Column
                field="status"
                header="Stav"
                body={statusBodyTemplate}
                sortable
                style={{ minWidth: "12rem" }}
                filter
                showFilterMenu={false}
                filterMenuStyle={{ width: "14rem" }}
                filterElement={statusRowFilterTemplate}
              ></Column>
              <Column
                field="title"
                header="Název"
                sortable
                style={{ minWidth: "16rem" }}
              ></Column>
              <Column
                field="note"
                header="Poznámka"
                sortable
                style={{ minWidth: "12rem" }}
              ></Column>
              <Column
                field="created_at"
                header="Datum"
                body={dateBodyTemplate}
                sortable
                style={{ minWidth: "16rem" }}
              ></Column>
              <Column
                body={actionBodyTemplate}
                exportable={false}
                style={{ minWidth: "12rem" }}
              ></Column>
            </DataTable>
          </div>

          <Dialog
            visible={listTitleDialog}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Změna názvu seznamu"
            placeholder={list.title}
            modal
            className="p-fluid"
            onHide={hideListTitleDialog}
          >
            <Formik
              initialValues={{
                id: list.id,
                title: list.title,
              }}
              validationSchema={Yup.object({
                title: Yup.string()
                  .min(3, "Musí obsahovat alespoň 3 znaky")
                  .required("Povinné pole"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                setTimeout(() => {
                  saveListTitle(values);
                  setSubmitted(false);
                  setSubmitting(false);
                }, 500);
              }}
            >
              {(formik) => (
                <div className="flex card justify-content-center">
                  <Form className="flex flex-column gap-2">
                    <ItemInput id="title" name="title" label="Název" />
                    <Button
                      type="submit"
                      severity="secondary"
                      icon={<FontAwesomeIcon icon={faSave} className="mr-1" />}
                      label="Uložit"
                    />
                  </Form>
                </div>
              )}
            </Formik>
          </Dialog>

          <Dialog
            visible={addItemDialog}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Nová položka"
            modal
            className="p-fluid"
            onHide={hideAddItemDialog}
          >
            <Formik
              initialValues={{
                id: item.id,
                owner: item.owner,
              }}
              validationSchema={Yup.object({
                title: Yup.string()
                  .min(3, "Musí obsahovat alespoň 3 znaky")
                  .required("Povinné pole"),
                note: Yup.string().max(
                  255,
                  "Musí obsahovat maximálně 255 znaků"
                ),
              })}
              onSubmit={(values, { setSubmitting }) => {
                setTimeout(() => {
                  saveItem(values);
                  setSubmitted(false);
                  setSubmitting(false);
                }, 500);
              }}
            >
              {(formik) => (
                <div className="flex card justify-content-center">
                  <Form className="flex flex-column gap-2">
                    <ItemInput id="title" name="title" label="Název" />
                    <ItemInput id="note" name="note" label="Poznámka" />
                    <Button
                      type="submit"
                      severity="secondary"
                      icon={<FontAwesomeIcon icon={faSave} className="mr-1" />}
                      label="Uložit"
                    />
                  </Form>
                </div>
              )}
            </Formik>
          </Dialog>

          <Dialog
            visible={deleteItemDialog}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Potvrzení"
            modal
            footer={deleteItemDialogFooter}
            onHide={hideDeleteItemDialog}
          >
            <div className="confirmation-content">
              <i
                className="pi pi-exclamation-triangle mr-3"
                style={{ fontSize: "2rem" }}
              />
              {item && (
                <span>
                  Opravdu chcete smazat položku <b>{item.title}</b>?
                </span>
              )}
            </div>
          </Dialog>

          <Dialog
            visible={deleteMemberDialog}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Potvrzení"
            modal
            footer={deleteMemberDialogFooter}
            onHide={hideDeleteMemberDialog}
          >
            <div className="confirmation-content">
              <i
                className="pi pi-exclamation-triangle mr-3"
                style={{ fontSize: "2rem" }}
              />
              {item && <span>Opravdu se chcete odstranit jako člen?</span>}
            </div>
          </Dialog>

          <Dialog
            visible={membersDialog}
            style={{ width: "50rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Správa členů"
            modal
            onHide={hideMembersDialog}
          >
            <div className="flex card justify-content-center">
              <PickList
                source={users}
                target={members}
                onChange={onMemberChange}
                itemTemplate={itemUserTemplate}
                breakpoint="1400px"
                sourceHeader="Uživatelé"
                targetHeader="Členi"
                sourceStyle={{ height: "30rem" }}
                targetStyle={{ height: "30rem" }}
              />
            </div>
          </Dialog>
        </div>
      );
    case "auth":
      return (
        <div className="card">
          <h2>Please Log In</h2>
        </div>
      );
    case "error":
      return (
        <div>
          <ErrorResponse
            status={callStatus.status}
            statusText={callStatus.statusText}
            message={callStatus.message}
          />
        </div>
      );
    default:
      return (
        <div>
          <Progress />
        </div>
      );
  }
}

export default ItemsList;
