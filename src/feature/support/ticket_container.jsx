import React, {useEffect} from "react";
import {Divider, Typography} from "@material-ui/core";
import CategorySelector from "../../common/test/CategorySelector";
import RadioGroup from "@material-ui/core/RadioGroup";
import Button from "@material-ui/core/Button";
import AutoHideNotification from "../../common/notification/AutoHideNotification";
import Box from "@material-ui/core/Box";
import {makeStyles} from "@material-ui/styles";
import {useDispatch, useSelector} from "react-redux";
import {QLIK} from "../../data/constants/constants";
import {
    updateCategories,
    updateNotifyMessage,
    updateNotifyUser,
    updateOrganisationName,
    updatePersonDataCheckBox,
    updateSecondaryOptionDisabled,
    updateSecondaryOptionRequired,
    updateSelectedOption,
    updateTicketPriorities,
    updateTicketStatusUrl,
    updateTicketSubmitted,
    updateTicketTypes,
    updateTicketValues,
    updateValidForm
} from "../../data/redux/dispatchers/ticket";
import ZenDeskApi from "../../data/api/ZenDeskApi";
import Description from "./description";
import ShortDescription from "./short_description";
import TypeSelection from "./type_selection";
import PrioritySelection from "./priority_selection";
import Submitted from "./submitted";
import UserInformation from "./user_information";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        justifyContent: "center"
    },
    content: {
        width: "75%"
    },
    ticketForm: {
        border: "1px solid",
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        borderColor: theme.palette.grey[400],
    },
    title: {
        paddingLeft: theme.spacing(0),
        paddingBottom: theme.spacing(1)
    },
    component: {
        display: "flex",
    },
    group: {
        marginBottom: theme.spacing(1),
    },
    buttons: {
        display: "flex",
        justifyContent: "flex-end",
    },
    ticketType: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectionBox: {
        borderStyle: "solid",
        border: "1px",
        borderLeft: 0,
        borderRight: 0,
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        borderColor: "darkgrey",
    },
}));

export default function TicketContainer() {

    const classes = useStyles();
    const values = useSelector(state => state.ticket.values);
    const ticket = useSelector(state => state.ticket);
    const ticketSubmitted = useSelector(state => state.ticket.submitted);
    const organisation = useSelector(state => state.ticket.organisationName);
    const message = useSelector(state => state.ticket.message);
    const showNotification = useSelector(state => state.ticket.showNotification);
    const orgName = useSelector(state => state.ticket.organisationName);
    const categories = useSelector(state => state.ticket.categories);
    const disabled = useSelector(state => state.ticket.optionDisabled);
    const personDataCheckBoxChecked = useSelector(state => state.ticket.personDataChecked);
    const categoryError = useSelector(state => state.ticket.categoryError);
    const organisationError = useSelector(state => state.ticket.organisationError);
    const dispatch = useDispatch();

    useEffect(() => {
            ZenDeskApi.getPriority().then(response =>
                dispatch(updateTicketPriorities(response[1]))
            );
            ZenDeskApi.getType().then(response =>
                dispatch(updateTicketTypes(response[1]))
            );
            ZenDeskApi.getCategory().then(response => {
                    dispatch(updateCategories(response[1]));
                }
            );
            if (localStorage.getItem("saved") === "true") {
                let newArray = {...values};
                newArray["firstName"] = localStorage.getItem("firstName") !== "undefined" ? localStorage.getItem("firstName") : '';
                newArray["lastName"] = localStorage.getItem("lastName") !== "undefined" ? localStorage.getItem("lastName") : '';
                newArray["phone"] = localStorage.getItem("phone") !== "undefined" ? localStorage.getItem("phone") : '';
                newArray["mail"] = localStorage.getItem("mail") !== "undefined" ? localStorage.getItem("mail") : '';
                dispatch(updateTicketValues(newArray));
                dispatch(updatePersonDataCheckBox(true));
                dispatch(updateOrganisationName(localStorage.getItem("organisation")));
            }
        },
        [dispatch,]);

    function notify(notify, message) {
        dispatch(updateNotifyUser(notify));
        dispatch(updateNotifyMessage(message));
    }

    function onCloseNotification() {
        dispatch(updateNotifyUser(false));
    }

    function createTicket() {
        let tags = [orgName];
        tags.push(values.category);
        tags.push("vigo-support");
        tags.push(values.category === QLIK ? values.selectedOption : null);
        tags.push(organisation);
        return {
            subject: values.shortDescription,
            organisation: {
                name: orgName,
                organisationNumber: "99999999999",
            },
            vigoUser: {
                firstName: values.firstName,
                lastName: values.lastName,
                mobileNumber: values.phone,
                mailAddress: values.mail,
            },
            type: values.selectedType,
            priority: values.selectedPriority,
            tags: [...tags],
            comment: {
                body: values.description,
            },
        }
    }

    function handleChange(event) {
        if (personDataCheckBoxChecked) {
            localStorage.setItem("firstName", values.firstName);
            localStorage.setItem("lastName", values.lastName);
            localStorage.setItem("phone", values.phone);
            localStorage.setItem("mail", values.mail);
        }
        let newArray = {...values};

        newArray[event.target.name] = event.target.value;
        dispatch(updateTicketValues(newArray));

        if (event.target.name === "category") {
            const newArray = {...disabled};
            categories.map(cat => {
                newArray[cat.name] = cat.name === event.target.value;
                return null;
            });
            dispatch(updateSelectedOption(null));
            dispatch(updateSecondaryOptionDisabled(newArray));
            dispatch(updateSecondaryOptionRequired(newArray));
        }
    }

    function submitTicket() {
        if (isTicketValid()) {
            ZenDeskApi.createTicket(createTicket()).then((response) => {
                if (response.status === 202) {
                    dispatch(updateTicketStatusUrl(response.headers.get("location")));
                    dispatch(updateTicketSubmitted(true));
                } else {
                    notify(true, "Oisann, det gikk ikke helt etter planen. Prøv igjen :)");
                }
            });
        } else {
            if (categoryError) {
                notify(true, "Vennligst velg en kategori, en type og en prioritet.");

            } else if (organisationError) {
                notify(true, "Vennligst velg et fylke.");

            } else if (!validEmail(values.mail)) {
                notify(true, "E-postadresse er ikke korrekt fylt ut.");

            } else
                notify(true, "Alle felter merket med * må fylles ut.");

        }
    }

    function isTicketValid() {
        const valid = isOptionsSelected() && isTextFieldsFilled() && validEmail(values.mail);
        console.log(isOptionsSelected() && isTextFieldsFilled() && validEmail(values.mail));

        updateValidFormValues(valid);

        return valid;
    }


    function isTextFieldsFilled() {
        function textFieldFilled(text) {
            if (text) {
                return text.length > 0;
            }
            return false;
        }

        return (textFieldFilled(values.description) &&
            textFieldFilled(values.shortDescription) &&
            textFieldFilled(values.firstName) &&
            textFieldFilled(values.lastName) &&
            textFieldFilled(values.phone) &&
            textFieldFilled(values.mail));
    }

    function isOptionsSelected() {
        return organisation.toString() !== "" &&
            values.selectedPriority !== "" &&
            values.selectedType !== "" &&
            values.category !== "";
    }

    function validEmail(mail) {
        let valid = true;
        if (!mail) {
            valid = false;
        }

        if (typeof mail !== "undefined") {
            let lastAtPos = mail.lastIndexOf('@');
            let lastDotPos = mail.lastIndexOf('.');

            if (!(lastAtPos < lastDotPos && lastAtPos > 0 && mail.indexOf('@@') === -1 && lastDotPos > 2 && (mail.length - lastDotPos) > 2)) {
                valid = false;
            }
        }
        return valid;

    }

    function updateValidFormValues(valid) {
        const newArray = {...ticket};
        newArray["formError"] = !valid;
        newArray["descriptionError"] = !values.description;
        newArray["shortDescriptionError"] = !values.shortDescription;
        newArray["firstNameError"] = !values.firstName;
        newArray["lastNameError"] = !values.lastName;
        newArray["phoneError"] = !values.phone;
        newArray["mailError"] = !validEmail(values.mail);
        newArray["typeError"] = !values.selectedType;
        newArray["priorityError"] = !values.selectedPriority;
        newArray["organisationError"] = organisation.toString() === '';
        newArray["categoryError"] = !values.category;
        dispatch(updateValidForm(newArray));
    }

    function renderTicketForm() {
        return (
            <div className={classes.root}>
                <AutoHideNotification
                    showNotification={showNotification}
                    message={message}
                    onClose={onCloseNotification}
                />
                <div className={classes.content}>
                    <Typography variant="h5" className={classes.title}>
                        Opprett sak
                    </Typography>
                    <Typography variant="body1" className={classes.title}>
                        Våre åpningstider er mandag til fredag 08:00 - 15:30
                    </Typography>
                    <Typography variant="body2" className={classes.title}>
                        NB! Dersom din henvendelse gjelder en av fagapplikasjonene til VIGO må du sende mail til vigo@ist.com
                    </Typography>
                    <Divider/>
                    <div className={classes.ticketForm}>
                        <UserInformation
                            onChange={handleChange}
                        />
                        <Divider/>
                        <Box>
                            <RadioGroup
                                aria-label="Gender"
                                name="category"
                                className={classes.group}
                                value={values.category || ''}
                                onChange={handleChange}
                            >
                                {categories.map(cat => {
                                    return (
                                        <CategorySelector key={cat.name} cat={cat}/>
                                    );
                                })}
                            </RadioGroup>
                        </Box>
                        <Box className={classes.selectionBox}>
                            <TypeSelection/>
                            <Box m={2}>
                                <Divider/>
                            </Box>
                            <PrioritySelection/>
                        </Box>
                        <ShortDescription
                            handleChange={handleChange}
                        />
                        <Description
                            handleChange={handleChange}
                        />
                    </div>
                    <div className={classes.buttons}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={submitTicket}
                        >
                            Send inn sak
                        </Button>
                    </div>

                </div>
            </div>
        );
    }

    return (<>{ticketSubmitted ? <Submitted/> : renderTicketForm()}</>);
}