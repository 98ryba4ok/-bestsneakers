import "./GenderGroup.css";
import GenderBanner from "../gender_banner/GenderBanner";
import man from '../../assets/man.png'
import woman from '../../assets/woman.png'
export default function GenderGroup() {
  return (
    <div className="Banner_container">   
<GenderBanner
  image={man}
  buttonText="Женское"
  link="/women"
/>

<GenderBanner
  image={woman}
  buttonText="Мужское"
  link="/men"
/>
</div>
  );
}