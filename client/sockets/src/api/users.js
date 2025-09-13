import axios from "axios";

export async function apiGetUsers(token,backendUrl){
let response = await axios.get(`${backendUrl}/api/users/contacts`,{headers: {Authorization: `Bearer ${token}`

}})
console.log(response)
return response
}