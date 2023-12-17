SELECT firstname, lastname, peleton.name, kompani.name, role.name from user
inner join peleton on user.peleton_id = peleton.ID
inner join kompani on peleton.kompani_id = kompani.ID
inner join role on user.role_id = role.ID