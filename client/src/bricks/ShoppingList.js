import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faCheck,
  faXmark,
  faArrowAltCircleRight,
  faFilterCircleXmark,
  faCirclePlus,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import { DataView } from "primereact/dataview";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import StatusTag from "./StatusTag";
import ItemInput from "./ItemInput";
import { ShoppingListService } from "../Service";
import Progress from "./Progress";
import ErrorResponse from "./ErrorResponse";
import DateTag from "./DateTag";
import { useNavigate } from "react-router-dom";

let emptyMember = {
  email: "",
  created_at: "",
  avatar: "",
  id: "",
};

let emptyList = {
  id: "",
  title: "",
  status: "",
  owner: "",
  created_at: "",
  items: [],
  members: [],
};

function ShoppingList() {
  const [lists, setLists] = useState([]);
  const [list, setList] = useState(emptyList);
  const [visibleLists, setVisibleLists] = useState([]);
  const [status, setStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [owner, setOwner] = useState(emptyMember);
  const [deleteListDialog, setDeleteListDialog] = useState(false);
  const [addListDialog, setAddListDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [callStatus, setCallStatus] = useState({ state: "pending" });
  const toast = useRef(null);
  const statuses = [
    { name: "Nové", code: "new" },
    { name: "Hotové", code: "done" },
    { name: "Vše", code: "all" },
  ];
  let navigate = useNavigate();

  const url = "http://localhost:3000";

  // první načtení stránky
  useEffect(() => {
    console.log("Starting useEffect"); // added
    fetch(`${url}/user/acec32c6-9f83-4e77-9228-9dab18e49a67`)
      .then(async (res) => {
        const userJson = await res.json();
        console.log("then"); // added
        if (res.ok) {
          setOwner(userJson);
          console.log("getUser"); //added
          return true;
        } else {
          console.log("fail"); // added
          console.log(res);
          setCallStatus({ state: "auth" });
          return false;
        }
      })
      .then((auth) => {
        if (auth) {
          ShoppingListService.getUsers().then(async (res) => {
            const usersJson = await res.json();
            if (res.ok) {
              setUsers(usersJson);
              console.log("getUsers"); //added
            } else {
              console.log(res);
              setUsers(owner);
            }
          });
          ShoppingListService.getShoppingLists().then(async (response) => {
            const responseJson = await response.json();
            switch (response.status) {
              case 200:
                setLists(responseJson);
                let _lists = responseJson.filter((l) => l.status === "new");
                setVisibleLists(_lists);
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

  const saveList = (values) => {
    setSubmitted(true);
    ShoppingListService.postShoppingList(values).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          let _lists = [...lists];
          let _visibleLists = [...visibleLists];
          _lists.push(responseJson);
          _visibleLists.push(responseJson);
          setLists(_lists);
          setVisibleLists(_visibleLists);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Seznam ${values.title} byl přidán`,
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
    setAddListDialog(false);
  };

  const deleteList = () => {
    ShoppingListService.deleteShoppingList(list.id).then(async (response) => {
      const responseJson = await response.json();
      switch (response.status) {
        case 200:
          let _lists = lists.filter((e) => e.id !== list.id);
          let _visibleLists = visibleLists.filter((e) => e.id !== list.id);
          console.log(visibleLists);
          setLists(_lists);
          setVisibleLists(_visibleLists);
          toast.current.show({
            severity: "success",
            summary: "Úspěch",
            detail: `Seznam ${list.title} byl smazán`,
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
    setDeleteListDialog(false);
    setList(emptyList);
  };

  // Nový seznam
  const leftToolbarTemplate = () => {
    if (owner && owner.id !== "") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            label="Nový seznam"
            icon={<FontAwesomeIcon className="mr-1" icon={faCirclePlus} />}
            severity="success"
            onClick={() => setAddListDialog(true)}
          />
        </div>
      );
    }
  };

  //Filtr listů
  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          icon={<FontAwesomeIcon className="mr-1" icon={faFilterCircleXmark} />}
          severity="secondary"
          onClick={() => {
            let _lists = lists.filter((e) => e.status === "new");
            setVisibleLists(_lists);
            setStatus(null);
          }}
        />
        <Dropdown
          placeholder="Dle stavu"
          name="filter"
          inputId="filter"
          options={statuses}
          optionLabel="name"
          optionValue="code"
          value={status}
          onChange={(e) => {
            if (e.value === "all") {
              setVisibleLists(lists);
            } else {
              let _lists = lists.filter((val) => e.value === val.status);
              setVisibleLists(_lists);
            }
            setStatus(e.value);
          }}
        />
      </div>
    );
  };

  const confirmDeleteList = (l) => {
    setList(l);
    setDeleteListDialog(true);
  };

  const hideDeleteListDialog = () => {
    setDeleteListDialog(false);
  };

  const hideAddListDialog = () => {
    setSubmitted(false);
    setAddListDialog(false);
  };

  const deleteListDialogFooter = (
    <React.Fragment>
      <Button
        label="Ne"
        icon={<FontAwesomeIcon icon={faXmark} className="mr-1" />}
        outlined
        onClick={() => setDeleteListDialog(false)}
      />
      <Button
        label="Ano"
        icon={<FontAwesomeIcon icon={faCheck} className="mr-1" />}
        severity="danger"
        onClick={deleteList}
      />
    </React.Fragment>
  );

  //Trash can
  const header = (l) => (
    <div className="flex flex-wrap justify-content-between gap-2 ml-3 mt-1 mr-3">
      <DateTag date={l.created_at} />
      <Button
        icon={<FontAwesomeIcon icon={faTrashCan} />}
        rounded
        text
        visible={l.status !== "cancelled" && l.owner === owner.id}
        severity="danger"
        onClick={() => confirmDeleteList(l)}
        size="small"
      />
    </div>
  );

  //Detail listu
  const footer = (l) => (
    <div className="flex flex-wrap justify-content-end gap-2">
      <Button
        label="Detail"
        icon={
          <FontAwesomeIcon className={"mr-1"} icon={faArrowAltCircleRight} />
        }
        onClick={() => {
          let path = `list/${l.id}`;
          navigate(path);
        }}
      />
    </div>
  );

  //obecné nalezení vlasnotsti objektu v poli objektů (hledám email objektu owner v poli objektů members)
  const getOwner = (owner, members) => {
    const index = members.findIndex((e) => e.id === owner);
    return members[index].email;
  };

  //zobrazí shopping...
  const getShoppingList = (list) => {
    return (
      <div className="card flex justify-content-center m-5">
        <Card
          title={list.title}
          subTitle={<StatusTag status={list.status} />}
          footer={footer(list)}
          header={header(list)}
          className="md:w-20rem"
        >
          <p className="m-0">Owner: {getOwner(list.owner, list.members)}</p>
        </Card>
      </div>
    );
  };
  // konec shoppping list...

  //toto lze dále vykonat na stránce:
  switch (callStatus.state) {
    case "ok":
      console.log("Rendering ShoppingList");
      return (
        <div className="card">
          <div className="flex grid m-5 justify-content-center grid">
            <Toast ref={toast} />
            <br />
            <div className="col-12">
              <Toolbar
                className="mb-4"
                start={leftToolbarTemplate}
                end={rightToolbarTemplate}
              />
            </div>
            <DataView // zobrazí všechny visible listy...
              value={visibleLists}
              layout="grid"
              itemTemplate={getShoppingList}
            />
          </div>

          <Dialog // DIALOG ADD LIST:
            visible={addListDialog}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Nový seznam"
            modal
            className="p-fluid"
            onHide={hideAddListDialog}
          >
            <Formik
              initialValues={{
                owner: owner.id,
                status: "new",
                members: [owner],
              }}
              validationSchema={Yup.object({
                title: Yup.string()
                  .min(3, "Musí obsahovat alespoň 3 znaky")
                  .required("Povinné pole"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                setTimeout(() => {
                  saveList(values);
                  setSubmitted(false);
                  setSubmitting(false);
                }, 500);
              }}
            >
              {(formik) => (
                <div className="flex card justify-content-center">
                  <Form className="flex flex-column gap-2">
                    <ItemInput id="title" name="title" label="Název" />
                    <MultiSelect
                      id="user"
                      name="user"
                      options={users}
                      value={formik.values.members}
                      onChange={(e) => {
                        formik.setFieldValue("members", e.value);
                      }}
                      optionLabel="email"
                      placeholder="Vyber členy"
                      className="w-full md:w-20rem"
                    />
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
            visible={deleteListDialog}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            header="Potvrzení"
            modal
            footer={deleteListDialogFooter}
            onHide={hideDeleteListDialog}
          >
            <div className="confirmation-content">
              <i
                className="pi pi-exclamation-triangle mr-3"
                style={{ fontSize: "2rem" }}
              />
              {list && (
                <span>
                  Opravdu chcete smazat seznam <b>{list.title}</b>?
                </span>
              )}
            </div>
          </Dialog>
        </div>
      );
    case "auth":
      console.log("Rendering auth message");
      return (
        <div className="card">
          <h2>Please Log In</h2>
        </div>
      );
    case "error":
      console.log("Rendering error message");
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
      console.log("Rendering Progress");
      return (
        <div>
          <p>{callStatus.state}</p>

          <Progress />
        </div>
      );
  }
}

export default ShoppingList;
