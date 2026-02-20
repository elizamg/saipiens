import re

class Prompt:
    def get_parameter_names(self):
        parameter_names = re.findall(r'\{\{(.*?)\}\}', self.raw_prompt)
        valid_parameter_names = [name for name in parameter_names if not bool(re.search(r'\s', name))]

        assert len(valid_parameter_names) == len(parameter_names), "Parameter names must not contain whitespace!"

        return valid_parameter_names

    def __init__(self, raw_prompt: str):
        self.raw_prompt = raw_prompt
        self.parameter_names = self.get_parameter_names()

    def arguments_to_content(self, must_have_all_parameters=True, **kwargs):
        assert (not must_have_all_parameters) or set(kwargs.keys()) == set(self.parameter_names), f"Not all parameters specified! Expected {self.parameter_names}, got {kwargs.keys()}"

        pattern = r"\{\{.*?\}\}"
        split_prompt = re.split(pattern, self.raw_prompt)

        filled_prompt = split_prompt.copy()

        for i in reversed(range(len(split_prompt) - 1)):
            filled_prompt.insert(i + 1, kwargs[self.parameter_names[i]])

        if len(filled_prompt) == 1:
            return filled_prompt
        
        index = 1
        while index < len(filled_prompt):
            if filled_prompt[index] == "":
                filled_prompt.pop(index)
            elif type(filled_prompt[index]) is str and type(filled_prompt[index - 1]) is str:
                filled_prompt[index - 1] += filled_prompt[index]
                filled_prompt.pop(index)
            else:
                index += 1

        return filled_prompt

if __name__ == "__main__":
    prompt = Prompt("Hello, {{NAME}}! Welcome to {{PLACE}}. {{NON_STRING}} {{PLACE}}")
    arguments = {"NAME": "Alice", "PLACE": "Wonderland", "NON_STRING": 123}
    filled = prompt.arguments_to_content(**arguments)
    print(prompt.raw_prompt)
    print(arguments)
    print(filled)
    assert filled == ["Hello, Alice! Welcome to Wonderland. ", 123, " Wonderland"]